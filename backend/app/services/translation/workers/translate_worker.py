from __future__ import annotations

import argparse
import os
import time
from pathlib import Path

from ..core.config import settings
from app.logger import get_logger
from ..core.queue import FileQueue
from ..core.storage import LocalStorage
from ..core.models import JobStatus
from ..services import orchestrator
from ..services.docx.ooxml import extract_segments as extract_docx_segments, inject_translations as inject_docx_translations
from ..services.docx.masking import apply_masks, revert_masks
from ..services.llm.openrouter import OpenRouterClient
from ..core import joblog
from app.services.translation.history_store import history_store


log = get_logger("worker")


def _cancel_if_requested(storage: LocalStorage, job_id: str, *, job_progress: dict | None = None, current_file: dict | None = None) -> bool:
    meta = storage.load_job_meta(job_id) or {}
    if meta.get("cancel_requested"):
        orchestrator.update_status(
            storage,
            job_id,
            JobStatus.CANCELLED,
            progress=job_progress,
            current_file=current_file,
        )
        joblog.append(job_id, "Job cancelled by user")
        log.info("job %s cancelled by user request", job_id)
        return True
    return False


def process_job(job_id: str, storage: LocalStorage, client: OpenRouterClient) -> bool:
    meta = storage.load_job_meta(job_id)
    if not meta:
        log.error("meta not found for job %s", job_id)
        return False
    if _cancel_if_requested(storage, job_id):
        return True
    orchestrator.update_status(storage, job_id, JobStatus.PROCESSING)

    input_files = storage.get_input_files(job_id)
    output_files = []
    history_items: list[dict] = []
    # Initialize aggregated job progress
    BATCH_SIZE = int(os.getenv("TRANSLATION_BATCH_SIZE", "10"))
    job_progress = {
        "batch_size": BATCH_SIZE,
        "total_segments": 0,
        "translated_segments": 0,
        "total_batches": 0,
        "completed_batches": 0,
    }
    
    # Check cancel before starting file loop
    if _cancel_if_requested(storage, job_id, job_progress=job_progress):
        return True

    for in_path in input_files:
        log.info("processing file job_id=%s path=%s", job_id, in_path)
        if _cancel_if_requested(storage, job_id, job_progress=job_progress):
            return True
        with open(in_path, "rb") as f:
            file_bytes = f.read()
        file_id, name = Path(in_path).name.split("__", 1)
        lower_name = name.lower()
        orchestrator.update_status(storage, job_id, JobStatus.PROCESSING, current_file={"file_id": file_id, "name": name})
        joblog.append(job_id, "Processing file", file_id=file_id, name=name)
        
        # Extract segments based on file type
        if not lower_name.endswith(".docx"):
            joblog.append(job_id, "Unsupported file type", file_id=file_id, name=name)
            log.error("unsupported file type: %s", name)
            continue
        segments = extract_docx_segments(file_bytes)
        log.info("extracted segments job_id=%s count=%d", job_id, len(segments))
        joblog.append(job_id, "Segments extracted", file_id=file_id, count=len(segments))
        
        # compute per-file progress and merge into job progress
        file_total = len(segments)
        file_total_batches = (file_total + BATCH_SIZE - 1) // BATCH_SIZE
        file_progress = {
            "batch_size": BATCH_SIZE,
            "total_segments": file_total,
            "translated_segments": 0,
            "total_batches": file_total_batches,
            "completed_batches": 0,
        }
        job_progress["total_segments"] += file_total
        job_progress["total_batches"] += file_total_batches
        orchestrator.update_status(
            storage,
            job_id,
            JobStatus.PROCESSING,
            current_file={"file_id": file_id, "name": name},
            progress=job_progress,
            current_file_progress=file_progress,
        )
        
        # Build LLM batch: apply masking per segment
        llm_segments = []
        mask_maps = {}
        for seg in segments:
            masked, m = apply_masks(seg.source)
            mask_maps[seg.id] = m
            llm_segments.append({
                "id": seg.id,
                "source": masked,
                "glossary": {},
                "do_not_translate": list(m.keys()),
                "style": meta.get("options", {}).get("style", {"tone": "formal", "terseness": "concise"}),
            })

        # Prepare batches
        batches = []
        for i in range(0, len(llm_segments), BATCH_SIZE):
            batches.append(llm_segments[i : i + BATCH_SIZE])

        mapping = {}
        total_translated = 0

        from concurrent.futures import ThreadPoolExecutor, as_completed

        # Helper function that returns results/logs instead of writing them
        def process_batch_safe(batch):
            # Check for cancel (read-only)
            # We do NOT call _cancel_if_requested here because it writes to DB.
            # Just check the meta file directly or assume main thread handles it.
            # But to save resources, we can check.
            # However, storage.load_job_meta reads a file. Frequent reads might be ok.
            # Let's skip check here to avoid read contention or just rely on main thread checking.
            # Actually, if we don't check, we might waste tokens.
            # Let's check but NOT write.
            try:
                m = storage.load_job_meta(job_id)
                if m and m.get("cancel_requested"):
                    return {"cancelled": True}
            except Exception:
                pass

            batch_ids = [s["id"] for s in batch]
            id_to_seg = {s["id"]: s for s in batch}
            local_mapping = {}
            logs = []
            
            try:
                translated = client.translate_batch(
                    batch,
                    target_locale=meta.get("options", {}).get("target_locale", "en-US"),
                    source_locale=meta.get("options", {}).get("source_locale"),
                    style=meta.get("options", {}).get("style"),
                )
            except Exception as e:
                logs.append({"level": "ERROR", "msg": "LLM translate error", "error": str(e)})
                raise

            got_ids = set()
            for item in translated:
                seg_id = item.get("id")
                if not seg_id:
                    continue
                got_ids.add(seg_id)
                target_masked = item.get("target", "")
                target = revert_masks(target_masked, mask_maps.get(seg_id, {}))
                local_mapping[seg_id] = target

            # Retry missing ones with single-item calls
            missing_ids = [sid for sid in batch_ids if sid not in got_ids]
            for sid in missing_ids:
                seg = id_to_seg[sid]
                success = False
                for attempt in range(2):
                    try:
                        items = client.translate_batch(
                            [seg],
                            target_locale=meta.get("options", {}).get("target_locale", "en-US"),
                            source_locale=meta.get("options", {}).get("source_locale"),
                            style=meta.get("options", {}).get("style"),
                        )
                        if items and items[0].get("id") == sid:
                            target_masked = items[0].get("target", "")
                            local_mapping[sid] = revert_masks(target_masked, mask_maps.get(sid, {}))
                            success = True
                            break
                    except Exception as e:
                        logs.append({"level": "WARNING", "msg": "LLM retry error(single)", "error": str(e), "seg_id": sid})
                        time.sleep(0.5 * (attempt + 1))
                if not success:
                    local_mapping[sid] = revert_masks(id_to_seg[sid]["source"], mask_maps.get(sid, {}))
                    logs.append({"level": "WARNING", "msg": "Fallback used (pass-through)", "seg_id": sid})
            
            return {"mapping": local_mapping, "logs": logs}

        # Parallel execution
        max_workers = int(os.getenv("TRANSLATION_MAX_WORKERS", "4"))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_batch = {executor.submit(process_batch_safe, batch): batch for batch in batches}
            
            for future in as_completed(future_to_batch):
                # Check cancellation in main thread
                if _cancel_if_requested(
                    storage,
                    job_id,
                    job_progress=job_progress,
                    current_file={"file_id": file_id, "name": name},
                ):
                    # Cancel all pending futures? 
                    # executor.__exit__ will wait for them. We can't easily cancel running threads.
                    # But we can stop processing results.
                    # Ideally we should shutdown executor.
                    executor.shutdown(wait=False, cancel_futures=True)
                    return True
                
                try:
                    result = future.result()
                    if result.get("cancelled"):
                        # Worker noticed cancellation
                        continue
                        
                    # Process logs
                    for log_entry in result.get("logs", []):
                        lvl = log_entry.pop("level", "INFO")
                        msg = log_entry.pop("msg", "")
                        joblog.append(job_id, msg, level=lvl, file_id=file_id, **log_entry)

                    # Process mapping
                    result_mapping = result.get("mapping", {})
                    if result_mapping:
                        mapping.update(result_mapping)
                        completed_now = len(result_mapping)
                        total_translated += completed_now
                        
                        # update per-file and job progress after each batch
                        file_progress["translated_segments"] += completed_now
                        file_progress["completed_batches"] += 1
                        job_progress["translated_segments"] += completed_now
                        job_progress["completed_batches"] += 1
                        
                        orchestrator.update_status(
                            storage,
                            job_id,
                            JobStatus.PROCESSING,
                            current_file={"file_id": file_id, "name": name},
                            progress=job_progress,
                            current_file_progress=file_progress,
                        )
                except Exception as exc:
                    log.error("Batch generated an exception: %s", exc)
                    joblog.append(job_id, "Batch failed", error=str(exc))
                    # If a batch fails, we probably should fail the job or at least not crash entirely?
                    # But if we miss segments, the file generation will fail or have holes.
                    # Let's re-raise to fail the job safely.
                    raise exc

        log.info("translated segments job_id=%s count=%d", job_id, total_translated)
        joblog.append(job_id, "Segments translated", file_id=file_id, count=total_translated)

        # Inject back
        new_bytes = inject_docx_translations(file_bytes, mapping)
        name_out = name[:-5] + ".translated.docx" if lower_name.endswith(".docx") else name + ".translated"

        # Save output
        out_path = storage.save_output(job_id, file_id, name_out, new_bytes)
        output_files.append({"file_id": file_id, "name": name_out, "path": out_path})
        log.info("output saved job_id=%s path=%s", job_id, out_path)
        joblog.append(job_id, "Output saved", file_id=file_id, path=out_path)
        
        # Save to Redis for persistence
        history_store.save_file_content(job_id, file_id, "target", new_bytes)
        
        history_items.append(
            {
                "file_id": file_id,
                "original_name": name,
                "translated_name": name_out,
            }
        )
        orchestrator.update_status(
            storage,
            job_id,
            JobStatus.PROCESSING,
            current_file=None,
            last_completed=file_id,
            progress=job_progress,
        )

    orchestrator.update_status(storage, job_id, JobStatus.SUCCEEDED, output_files=output_files)
    joblog.append(job_id, "Job finished", outputs=len(output_files))
    history_store.append(
        {
            "job_id": job_id,
            "completed_at": time.time(),
            "target_locale": (meta.get("options") or {}).get("target_locale"),
            "source_locale": (meta.get("options") or {}).get("source_locale"),
            "files": history_items,
        }
    )
    return True


def main():
    parser = argparse.ArgumentParser(description="Translate worker")
    parser.add_argument("--mock", action="store_true", help="Use mock translations")
    args = parser.parse_args()

    queue = FileQueue(settings.QUEUE_DIR)
    storage = LocalStorage(settings.STORAGE_DIR)
    client = OpenRouterClient(
        os.getenv("OPENROUTER_API_KEY"),
        settings.OPENROUTER_MODEL,
        mock=args.mock or settings.MOCK_TRANSLATION,
        site_url=os.getenv("OPENROUTER_SITE_URL"),
        site_name=os.getenv("OPENROUTER_SITE_NAME"),
    )

    log.info("worker started. queue=%s mock=%s", settings.QUEUE_DIR, client.mock)
    while True:
        job_id = queue.poll()
        if not job_id:
            time.sleep(1.0)
            continue
        log.info("picked job %s", job_id)
        try:
            ok = process_job(job_id, storage, client)
            if ok:
                queue.ack(job_id)
            else:
                queue.nack(job_id)
        except Exception as e:
            log.exception("job %s crashed: %s", job_id, e)
            queue.nack(job_id)


if __name__ == "__main__":
    main()

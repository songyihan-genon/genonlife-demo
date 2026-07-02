from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Generator, Iterable, Optional
from uuid import uuid4
import json
import os

from app.logger import get_logger
from app.services.translation.core import joblog
from app.services.translation.core.config import settings
from app.services.translation.core.models import JobStatus
from app.services.translation.core.queue import FileQueue
from app.services.translation.core.storage import LocalStorage
from app.services.translation.history_store import history_store
from app.services.translation.services import orchestrator


logger = get_logger(__name__)


@dataclass
class UploadedDocument:
    filename: str
    content: bytes


class TranslationService:
    """Manages translation job lifecycle (creation, status, results, logs)."""

    _ALLOWED_SUFFIXES = {".docx"}

    def __init__(self) -> None:
        self.storage = LocalStorage(settings.STORAGE_DIR)
        self.queue = FileQueue(settings.QUEUE_DIR)

    def _validate_uploads(self, docs: Iterable[UploadedDocument]) -> list[UploadedDocument]:
        docs_list = list(docs)
        if not docs_list:
            raise ValueError("No files uploaded")
        for doc in docs_list:
            suffix = Path(doc.filename).suffix.lower()
            if suffix not in self._ALLOWED_SUFFIXES:
                allowed = ", ".join(sorted(self._ALLOWED_SUFFIXES))
                raise ValueError(f"Unsupported file type: {doc.filename} (allowed: {allowed})")
            if not doc.content:
                raise ValueError(f"Uploaded file is empty: {doc.filename}")
        return docs_list

    def create_job(
        self,
        docs: Iterable[UploadedDocument],
        *,
        target_locale: str = "en-US",
        source_locale: Optional[str] = None,
        tone: str = "formal",
        terseness: str = "concise",
        include_notes: bool = True,
        include_comments: bool = True,
        webhook: Optional[str] = None,
    ) -> dict:
        uploads = self._validate_uploads(docs)

        job_id = str(uuid4())
        logger.info(
            "create_job start job_id=%s files=%d target=%s source=%s tone=%s terseness=%s",
            job_id,
            len(uploads),
            target_locale,
            source_locale,
            tone,
            terseness,
        )
        joblog.append(
            job_id,
            "Job created",
            target_locale=target_locale,
            source_locale=source_locale,
        )

        saved_files = []
        for document in uploads:
            file_id = str(uuid4())
            path = self.storage.save_input(job_id, file_id, document.filename, document.content)
            logger.info(
                "saved input file_id=%s name=%s bytes=%d path=%s",
                file_id,
                document.filename,
                len(document.content),
                path,
            )
            joblog.append(
                job_id,
                "Input saved",
                file_id=file_id,
                name=document.filename,
                size=len(document.content),
            )
            saved_files.append(
                {
                    "file_id": file_id,
                    "name": document.filename,
                    "path": path,
                }
            )
            # Save source to Redis for persistence
            history_store.save_file_content(job_id, file_id, "source", document.content)

        job = {
            "job_id": job_id,
            "status": JobStatus.QUEUED.value,
            "options": {
                "target_locale": target_locale,
                "source_locale": source_locale,
                "style": {"tone": tone, "terseness": terseness},
                "include_notes": include_notes,
                "include_comments": include_comments,
            },
            "webhook": webhook,
            "files": saved_files,
            "metrics": {"segments": 0, "tokens_in": 0, "tokens_out": 0},
            "cancel_requested": False,
        }
        self.storage.save_job_meta(job_id, job)
        logger.info("job meta saved job_id=%s", job_id)
        joblog.append(job_id, "Job metadata saved")
        self.queue.enqueue(job_id)
        logger.info("enqueued job job_id=%s queue_dir=%s", job_id, settings.QUEUE_DIR)
        joblog.append(job_id, "Job enqueued")
        return {
            "job_id": job_id,
            "status": job["status"],
            "files": [{"file_id": f["file_id"], "name": f["name"]} for f in saved_files],
        }

    def get_job(self, job_id: str) -> dict:
        meta = self.storage.load_job_meta(job_id)
        if not meta:
            # Try to construct minimal meta from history if not in active storage?
            # For now, just raise.
            raise KeyError("Job not found")
        logger.debug("get_job job_id=%s status=%s", job_id, meta.get("status"))
        return meta

    def get_result(self, job_id: str, file_id: Optional[str] = None) -> tuple[str, str, bytes | None]:
        # Returns path, filename, content_bytes (if from redis)
        # If content_bytes is returned, path might be dummy or None.
        
        # First try to get meta to find filename
        meta = self.storage.load_job_meta(job_id)
        filename = "translated.docx"
        
        if meta:
            if meta.get("status") != JobStatus.SUCCEEDED.value:
                # If job is not succeeded in meta, it might be old history.
                pass
            
            out_files = meta.get("output_files") or []
            file_meta = None
            if out_files:
                if file_id:
                    file_meta = next((item for item in out_files if item.get("file_id") == file_id), None)
                if not file_meta:
                    file_meta = out_files[0]
                if file_meta:
                    path = file_meta.get("path")
                    filename = file_meta.get("name") or os.path.basename(path)
                    if path and os.path.exists(path):
                        return path, filename, None

        # Fallback to Redis
        # We need file_id. If not provided, we can't easily guess without meta.
        # But history_store.list() might have it.
        if not file_id:
             # Try to find file_id from history
             hist = history_store.list(100)
             item = next((i for i in hist if i["job_id"] == job_id), None)
             if item and item.get("files"):
                 file_id = item["files"][0].get("file_id")
                 filename = item["files"][0].get("translated_name") or filename
        
        if file_id:
            content = history_store.get_file_content(job_id, file_id, "target")
            if content:
                return "", filename, content

        raise FileNotFoundError("Output not found in storage or history")

    def get_source(self, job_id: str, file_id: Optional[str] = None) -> tuple[str, str, bytes | None]:
        meta = self.storage.load_job_meta(job_id)
        filename = "source.docx"
        
        if meta:
            input_files = meta.get("files") or []
            file_meta = None
            if input_files:
                if file_id:
                    file_meta = next((item for item in input_files if item.get("file_id") == file_id), None)
                if not file_meta:
                    file_meta = input_files[0]
                
                if file_meta:
                    path = file_meta.get("path")
                    filename = file_meta.get("name") or os.path.basename(path)
                    if path and os.path.exists(path):
                        return path, filename, None

        # Fallback to Redis
        if not file_id:
             hist = history_store.list(100)
             item = next((i for i in hist if i["job_id"] == job_id), None)
             if item and item.get("files"):
                 file_id = item["files"][0].get("file_id")
                 filename = item["files"][0].get("original_name") or filename

        if file_id:
            content = history_store.get_file_content(job_id, file_id, "source")
            if content:
                return "", filename, content

        raise FileNotFoundError("Input not found in storage or history")

    def delete_history(self, job_id: str) -> bool:
        return history_store.delete_job(job_id)

    def get_logs(self, job_id: str, file_id: Optional[str] = None) -> list[dict]:
        logs = joblog.read_all(job_id)
        if file_id:
            logs = [entry for entry in logs if entry.get("file_id") == file_id]
        return logs

    def get_logs(self, job_id: str, file_id: Optional[str] = None) -> list[dict]:
        logs = joblog.read_all(job_id)
        if file_id:
            logs = [entry for entry in logs if entry.get("file_id") == file_id]
        return logs

    def list_history(self, limit: int = 20) -> list[dict]:
        return history_store.list(limit)

    def cancel_job(self, job_id: str) -> dict:
        meta = self.storage.load_job_meta(job_id)
        if not meta:
            raise KeyError("Job not found")
        status = (meta.get("status") or "").upper()
        terminal_statuses = {
            JobStatus.SUCCEEDED.value,
            JobStatus.FAILED.value,
            JobStatus.CANCELLED.value,
        }
        if status in terminal_statuses:
            logger.info("cancel_job ignored job_id=%s status=%s", job_id, status)
            if status == JobStatus.CANCELLED.value:
                return {"job_id": job_id, "status": status, "cancelled": True}
            raise ValueError("Job already finished")

        meta["cancel_requested"] = True
        self.storage.save_job_meta(job_id, meta)
        joblog.append(job_id, "Cancel requested")
        logger.info("cancel_job requested job_id=%s status=%s", job_id, status)

        if status == JobStatus.QUEUED.value:
            removed = self.queue.remove(job_id)
            logger.info("cancel_job removed from queue job_id=%s removed=%s", job_id, removed)
            orchestrator.update_status(self.storage, job_id, JobStatus.CANCELLED)
            joblog.append(job_id, "Job cancelled", reason="Removed from queue")
            return {"job_id": job_id, "status": JobStatus.CANCELLED.value, "cancelled": True}

        return {"job_id": job_id, "status": status, "cancel_requested": True}

    def stream_logs(self, job_id: str, file_id: Optional[str] = None) -> Generator[str, None, None]:
        path = joblog.log_path(job_id)

        def _gen() -> Generator[str, None, None]:
            last_pos = 0
            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            rec = json.loads(line)
                            if file_id and rec.get("file_id") != file_id:
                                continue
                            yield f"data: {json.dumps(rec, ensure_ascii=False)}\n\n"
                        except Exception:
                            continue
                    last_pos = f.tell()
            while True:
                if not path.exists():
                    import time as _t

                    _t.sleep(0.5)
                    continue
                with open(path, "r", encoding="utf-8") as f:
                    f.seek(last_pos)
                    new = f.read()
                    last_pos = f.tell()
                    if new:
                        for line in new.splitlines():
                            try:
                                rec = json.loads(line)
                                if file_id and rec.get("file_id") != file_id:
                                    continue
                                yield f"data: {json.dumps(rec, ensure_ascii=False)}\n\n"
                            except Exception:
                                continue
                import time as _t

                _t.sleep(0.5)

        return _gen()

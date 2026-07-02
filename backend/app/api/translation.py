from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from app.services.translation_service import TranslationService, UploadedDocument


router = APIRouter(prefix="/translation", tags=["translation"])
translation_service = TranslationService()


def _safe_filename(name: str | None) -> str:
    return name or "document.docx"


@router.post("/jobs")
async def create_translation_job(
    files: List[UploadFile] = File(...),
    target_locale: str = Form("en-US"),
    source_locale: Optional[str] = Form(None),
    tone: Optional[str] = Form("formal"),
    terseness: Optional[str] = Form("concise"),
    include_notes: bool = Form(True),
    include_comments: bool = Form(True),
    webhook: Optional[str] = Form(None),
):
    try:
        uploads = [
            UploadedDocument(filename=_safe_filename(upload.filename), content=await upload.read())
            for upload in files
        ]
        return translation_service.create_job(
            uploads,
            target_locale=target_locale,
            source_locale=source_locale,
            tone=tone or "formal",
            terseness=terseness or "concise",
            include_notes=include_notes,
            include_comments=include_comments,
            webhook=webhook,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/jobs/{job_id}")
def get_translation_job(job_id: str):
    try:
        return translation_service.get_job(job_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")


@router.get("/jobs/{job_id}/result")
def download_translation_result(job_id: str, file_id: Optional[str] = None):
    try:
        path, filename, content = translation_service.get_result(job_id, file_id=file_id)
        if content:
            from io import BytesIO
            return StreamingResponse(
                BytesIO(content),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Output not found")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return FileResponse(
        path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/jobs/{job_id}/source")
def download_translation_source(job_id: str, file_id: Optional[str] = None):
    try:
        path, filename, content = translation_service.get_source(job_id, file_id=file_id)
        if content:
            from io import BytesIO
            return StreamingResponse(
                BytesIO(content),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Source not found")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return FileResponse(
        path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.post("/jobs/{job_id}/cancel")
def cancel_translation_job(job_id: str):
    try:
        return translation_service.cancel_job(job_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/history/{job_id}")
def delete_translation_history(job_id: str):
    success = translation_service.delete_history(job_id)
    if not success:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"status": "deleted", "job_id": job_id}


@router.get("/jobs/{job_id}/logs")
def list_translation_logs(job_id: str, file_id: Optional[str] = None):
    return {"job_id": job_id, "logs": translation_service.get_logs(job_id, file_id)}


@router.get("/jobs/{job_id}/logs/stream")
def stream_translation_logs(job_id: str, file_id: Optional[str] = None):
    return StreamingResponse(
        translation_service.stream_logs(job_id, file_id),
        media_type="text/event-stream",
    )


@router.get("/history")
def list_translation_history(limit: int = 20):
    safe_limit = max(1, min(limit, 100))
    return {"items": translation_service.list_history(safe_limit)}

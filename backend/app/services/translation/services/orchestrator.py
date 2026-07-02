from app.logger import get_logger
from ..core.models import JobStatus
from ..core.storage import LocalStorage


log = get_logger(__name__)


def update_status(storage: LocalStorage, job_id: str, status: JobStatus, **kwargs):
    meta = storage.load_job_meta(job_id) or {"job_id": job_id}
    meta["status"] = status.value
    for k, v in kwargs.items():
        meta[k] = v
    storage.save_job_meta(job_id, meta)
    log.info("status update job_id=%s -> %s", job_id, status.value)

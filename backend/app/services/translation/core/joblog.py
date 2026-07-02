from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional, Iterable

from .config import settings


def _logs_dir() -> Path:
    return Path(settings.STORAGE_DIR) / "logs"


def log_path(job_id: str) -> Path:
    d = _logs_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{job_id}.log"


def append(job_id: str, message: str, level: str = "INFO", file_id: Optional[str] = None, **extra):
    rec = {
        "ts": time.time(),
        "level": level,
        "job_id": job_id,
        "file_id": file_id,
        "message": message,
    }
    if extra:
        rec.update(extra)
    path = log_path(job_id)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def read_all(job_id: str) -> list[dict]:
    path = log_path(job_id)
    out = []
    if not path.exists():
        return out
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except Exception:
                continue
    return out


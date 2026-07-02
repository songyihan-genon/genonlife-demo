from __future__ import annotations
import os
import json
from pathlib import Path
from typing import Any


class LocalStorage:
    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir)
        (self.base / "input").mkdir(parents=True, exist_ok=True)
        (self.base / "output").mkdir(parents=True, exist_ok=True)
        (self.base / "meta").mkdir(parents=True, exist_ok=True)

    def save_input(self, job_id: str, file_id: str, name: str, data: bytes) -> str:
        job_dir = self.base / "input" / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        path = job_dir / f"{file_id}__{name}"
        with open(path, "wb") as f:
            f.write(data)
        return str(path)

    def get_input_files(self, job_id: str) -> list[str]:
        job_dir = self.base / "input" / job_id
        if not job_dir.exists():
            return []
        return [str(p) for p in sorted(job_dir.glob("*"))]

    def save_output(self, job_id: str, file_id: str, name: str, data: bytes) -> str:
        job_dir = self.base / "output" / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        path = job_dir / f"{file_id}__{name}"
        with open(path, "wb") as f:
            f.write(data)
        return str(path)

    def get_output_files(self, job_id: str) -> list[str]:
        job_dir = self.base / "output" / job_id
        if not job_dir.exists():
            return []
        return [str(p) for p in sorted(job_dir.glob("*"))]

    def save_job_meta(self, job_id: str, meta: dict[str, Any]) -> None:
        path = self.base / "meta" / f"{job_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    def load_job_meta(self, job_id: str) -> dict[str, Any] | None:
        path = self.base / "meta" / f"{job_id}.json"
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)


from pathlib import Path
import json
import time
from typing import Optional


class FileQueue:
    def __init__(self, base_dir: str) -> None:
        self.base = Path(base_dir)
        self.queued = self.base / "queued"
        self.processing = self.base / "processing"
        self.done = self.base / "done"
        self.failed = self.base / "failed"
        for d in [self.queued, self.processing, self.done, self.failed]:
            d.mkdir(parents=True, exist_ok=True)

    def enqueue(self, job_id: str) -> None:
        msg = {"job_id": job_id, "ts": time.time()}
        path = self.queued / f"{job_id}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(msg, f)

    def poll(self) -> Optional[str]:
        for msg_path in sorted(self.queued.glob("*.json")):
            job_id = msg_path.stem
            # move to processing
            processing_path = self.processing / msg_path.name
            try:
                msg_path.rename(processing_path)
                return job_id
            except FileNotFoundError:
                continue
        return None

    def ack(self, job_id: str) -> None:
        path = self.processing / f"{job_id}.json"
        done = self.done / path.name
        if path.exists():
            path.rename(done)

    def nack(self, job_id: str, reason: str = "") -> None:
        path = self.processing / f"{job_id}.json"
        failed = self.failed / path.name
        if path.exists():
            path.rename(failed)

    def remove(self, job_id: str) -> bool:
        """Remove a job from the queued state if it has not started processing."""
        path = self.queued / f"{job_id}.json"
        if path.exists():
            path.unlink(missing_ok=True)
            return True
        return False

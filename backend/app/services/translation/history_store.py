import json
import os
import time
from typing import Any, Dict, List

import redis


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    _redis = redis.from_url(REDIS_URL, decode_responses=True)
except Exception as exc:  # pragma: no cover
    print(f"[translation] Redis connection failed: {exc}")
    _redis = None


class TranslationHistoryStore:
    KEY = "translation:history"

    def __init__(self, redis_client: redis.Redis | None) -> None:
        self.redis = redis_client

    def append(self, record: Dict[str, Any]) -> None:
        if not self.redis:
            return
        rec = {**record}
        rec.setdefault("completed_at", time.time())
        try:
            self.redis.lpush(self.KEY, json.dumps(rec, ensure_ascii=False))
            self.redis.ltrim(self.KEY, 0, 49)
        except Exception as exc:  # pragma: no cover
            print(f"[translation] Failed to append history: {exc}")

    def list(self, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.redis:
            return []
        try:
            raw_items = self.redis.lrange(self.KEY, 0, max(limit - 1, 0))
        except Exception as exc:  # pragma: no cover
            print(f"[translation] Failed to read history: {exc}")
            return []
        items: List[Dict[str, Any]] = []
        for raw in raw_items:
            try:
                items.append(json.loads(raw))
            except Exception:
                continue
        return items


    def save_file_content(self, job_id: str, file_id: str, kind: str, data: bytes) -> None:
        if not self.redis:
            return
        key = f"translation:file:{job_id}:{file_id}:{kind}"
        try:
            self.redis.set(key, data)
            # Set expiry to 30 days to avoid infinite growth, or keep it permanent?
            # User said "save all documents", implying persistence. Let's set a long TTL (e.g. 30 days).
            self.redis.expire(key, 60 * 60 * 24 * 30)
        except Exception as exc:
            print(f"[translation] Failed to save file content to Redis: {exc}")

    def get_file_content(self, job_id: str, file_id: str, kind: str) -> bytes | None:
        if not self.redis:
            return None
        key = f"translation:file:{job_id}:{file_id}:{kind}"
        try:
            return self.redis.get(key)
        except Exception as exc:
            print(f"[translation] Failed to get file content from Redis: {exc}")
            return None

    def delete_job(self, job_id: str) -> bool:
        if not self.redis:
            return False
        try:
            # 1. Remove from history list
            # Since we don't have the exact JSON string, we read all, filter, and rewrite.
            # This is safe because the list is small (capped at 50).
            items = self.list(limit=100)
            new_items = [item for item in items if item.get("job_id") != job_id]
            
            if len(items) == len(new_items):
                return False # Not found
            
            # Transactional update? For simplicity, just overwrite.
            self.redis.delete(self.KEY)
            if new_items:
                # Push in reverse order to maintain order (lpush reverses)
                # Actually list() returns in order (lrange 0 -1).
                # If we use lpush, we should push from last to first.
                for item in reversed(new_items):
                    self.redis.lpush(self.KEY, json.dumps(item, ensure_ascii=False))
            
            # 2. Delete associated files
            # We need to find file_ids. The item removed has them.
            removed_item = next((item for item in items if item.get("job_id") == job_id), None)
            if removed_item:
                files = removed_item.get("files", [])
                for f in files:
                    fid = f.get("file_id")
                    if fid:
                        self.redis.delete(f"translation:file:{job_id}:{fid}:source")
                        self.redis.delete(f"translation:file:{job_id}:{fid}:target")
            
            return True
        except Exception as exc:
            print(f"[translation] Failed to delete job {job_id}: {exc}")
            return False

history_store = TranslationHistoryStore(_redis)

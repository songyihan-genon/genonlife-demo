import datetime
import json
import os
from typing import Any, Dict, List, Optional

import redis.asyncio as redis
from redis.exceptions import RedisError

from app.logger import get_logger

log = get_logger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class WatchlistStore:
    def __init__(self) -> None:
        self.client = redis.from_url(REDIS_URL, decode_responses=True)
        self._fallback_store: Dict[str, Dict[str, Any]] = {}

    def _key(self, user_id: str) -> str:
        return f"user_watchlist:{user_id}"

    def _load_payload(self, raw: Optional[str]) -> Optional[Dict[str, Any]]:
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            log.warning("Failed to decode watchlist payload for redis value")
            return None

    async def get_watchlist(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        payload: Optional[Dict[str, Any]] = None
        try:
            raw = await self.client.get(self._key(user_id))
            payload = self._load_payload(raw)
        except RedisError as exc:
            log.warning("Redis unavailable when reading watchlist, using fallback store", exc_info=exc)

        if payload is None:
            payload = self._fallback_store.get(user_id)
            if payload:
                log.info("Serving watchlist for %s from fallback store", user_id)

        if not payload:
            return None

        stocks = payload.get("stocks")
        if isinstance(stocks, list):
            return stocks
        return None

    async def save_watchlist(self, user_id: str, stocks: List[Dict[str, Any]]) -> None:
        payload = {
            "user_id": user_id,
            "stocks": stocks,
            "updatedAt": datetime.datetime.utcnow().isoformat() + "Z",
        }
        encoded = json.dumps(payload, ensure_ascii=False)

        try:
            await self.client.set(self._key(user_id), encoded)
            log.debug("Watchlist for %s stored in redis", user_id)
        except RedisError as exc:
            log.warning("Redis unavailable when saving watchlist, falling back to in-memory store", exc_info=exc)

        # Always keep a fallback copy so users can continue working even if Redis goes down temporarily.
        self._fallback_store[user_id] = payload

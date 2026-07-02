import os
from typing import Optional

import redis.asyncio as redis


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class CacheStore:
    """
    Minimal async Redis wrapper used for caching expensive API responses.
    """

    def __init__(self) -> None:
        self.client = redis.from_url(REDIS_URL, decode_responses=True)

    async def get(self, key: str) -> Optional[str]:
        return await self.client.get(key)

    async def setex(self, key: str, ttl_seconds: int, value: str) -> None:
        await self.client.setex(key, ttl_seconds, value)
    
    async def delete(self, key: str) -> None:
        await self.client.delete(key)
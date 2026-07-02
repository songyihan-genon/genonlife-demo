from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Literal, Optional

import aiohttp

from app.logger import get_logger

log = get_logger(__name__)

SEARCH_API_URL = "https://www.searchapi.io/api/v1/search"
ResponseSize = Literal["short", "medium", "long"]
RESULT_SIZES: dict[ResponseSize, int] = {"short": 3, "medium": 5, "long": 7}


async def search_news(
    query: str,
    *,
    recency_days: Optional[int] = None,
    domains: Optional[list[str]] = None,
    response_length: ResponseSize = "medium",
) -> list[dict]:
    api_key = os.getenv("SEARCHAPI_KEY")
    if not api_key:
        raise RuntimeError("SEARCHAPI_KEY is not configured.")

    if domains:
        domain_filters = " OR ".join([f"site:{domain}" for domain in domains])
        query = f"{query} {domain_filters}"

    size = RESULT_SIZES.get(response_length, RESULT_SIZES["medium"])

    params: dict[str, str] = {
        "engine": "google",
        "api_key": api_key,
        "q": query,
        "num": str(size),
    }

    if recency_days:
        try:
            since = datetime.utcnow() - timedelta(days=int(recency_days))
            params["time_period_min"] = since.strftime("%m/%d/%Y")
        except Exception:
            log.warning("Invalid recency_days value provided: %s", recency_days)

    async with aiohttp.ClientSession() as session:
        async with session.get(SEARCH_API_URL, params=params) as response:
            response.raise_for_status()
            payload = await response.json()

    organic = payload.get("organic_results") or []
    results: list[dict] = []
    for item in organic:
        title = item.get("title") or item.get("headline") or "(untitled)"
        link = item.get("link") or item.get("url") or ""
        snippet = item.get("snippet") or item.get("description") or ""
        source = item.get("source")

        if not source:
            from urllib.parse import urlparse

            try:
                netloc = urlparse(link).netloc
                source = netloc or "unknown"
            except Exception:
                source = "unknown"

        results.append(
            {
                "title": title,
                "url": link,
                "snippet": snippet,
                "source": source,
                "date": item.get("date"),
            }
        )

    return results

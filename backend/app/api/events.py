import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from redis.exceptions import RedisError

from app.logger import get_logger
from app.stores.session_store import SessionStore
from app.utils import call_llm_summary
from app.data.mock_stock_news import get_mock_stock_news
from app.services.search_service import search_news

log = get_logger(__name__)
router = APIRouter(prefix="/api/events", tags=["events"])

# Initialize session store for caching
session_store = SessionStore()
EVENT_CACHE_VERSION = "v3_web_search"


class EventSearchRequest(BaseModel):
    date: str  # Format: YYYY-MM-DD
    stock_name: str
    stock_code: Optional[str] = None


class NewsEvent(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    date: Optional[str] = None


class EventSearchResponse(BaseModel):
    date: str
    stock_name: str
    events: List[NewsEvent]
    summary: Optional[str] = None
    cached: bool = False


def get_cache_key(date: str, symbol: str) -> str:
    """Generate a cache key for the event search."""
    return f"event_search:{EVENT_CACHE_VERSION}:{symbol}:{date}"


async def cache_get(key: str) -> Optional[str]:
    try:
        return await session_store.client.get(key)
    except RedisError as exc:
        log.warning("Event cache read failed for %s", key, exc_info=exc)
        return None


async def cache_setex(key: str, ttl_seconds: int, payload: str) -> None:
    try:
        await session_store.client.setex(key, ttl_seconds, payload)
    except RedisError as exc:
        log.warning("Event cache write failed for %s", key, exc_info=exc)


async def summarize_event_news(date: str, stock_name: str, events: List[NewsEvent]) -> Optional[str]:
    if not events:
        return None

    try:
        article_summaries = []
        for idx, event in enumerate(events, start=1):
            article_summaries.append(
                f"{idx}. 제목: {event.title}\n"
                f"   출처: {event.source}\n"
                f"   요약: {event.snippet}\n"
                f"   URL: {event.url}"
            )

        articles_text = "\n\n".join(article_summaries)
        prompt = (
            f"다음은 {date} 무렵 {stock_name}와 관련해 검색된 뉴스 입니다.\n"
            "핵심 이슈가 무엇인지 금융 애널리스트 관점에서 3~4문장으로 요약해주세요. "
            "가능하면 어떤 출처에서 나온 이야기인지도 함께 언급해 주세요.\n\n"
            f"{articles_text}"
        )

        messages = [
            {"role": "system", "content": "당신은 한국어로 concise하게 정리하는 금융 애널리스트입니다."},
            {"role": "user", "content": prompt},
        ]
        content = await call_llm_summary(
            messages,
            model=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"),
            temperature=0.2,
            max_tokens=300,
        )
        return content
    except Exception as e:
        log.error(f"Failed to summarize news for {stock_name} on {date}: {e}")
        return None


@router.post("/search", response_model=EventSearchResponse)
async def search_events(request: EventSearchRequest):
    """
    Search for inflection-point news on a specific date using Web Search (SearchAPI).
    """
    try:
        target_date = datetime.strptime(request.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    # Use stock name for better search results in Korea
    search_query = f"{request.stock_name} 주가 {request.date} 뉴스"
    
    # Cache key using stock_name + date (since we use stock_name for search)
    cache_key = get_cache_key(request.date, request.stock_name)

    cached_data = await cache_get(cache_key)
    if cached_data:
        log.info(f"Cache hit for {cache_key}")
        try:
            cached_result = json.loads(cached_data)
            events_payload = cached_result.get("events", [])
            summary_payload = cached_result.get("summary")
            return EventSearchResponse(
                date=request.date,
                stock_name=request.stock_name,
                events=[NewsEvent(**event) for event in events_payload],
                summary=summary_payload,
                cached=True,
            )
        except json.JSONDecodeError:
            log.warning(f"Failed to parse cached data for {cache_key}")

    try:
        # Perform Web Search
        # We don't use strict date filters here because SearchAPI's date filtering can be tricky with specific days.
        # Instead, we include the date in the query and fetch top results.
        raw_results = await search_news(
            query=search_query,
            response_length="medium", # Get ~5 results
            # recency_days=None # Optional: restrict if needed, but query usually handles it
        )
        
        events = []
        for item in raw_results:
             events.append(
                NewsEvent(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    snippet=item.get("snippet", ""),
                    source=item.get("source", "Web"),
                    date=item.get("date") # Might be null or formatted string
                )
            )

    except Exception as exc:
        log.error("Web search event news fetch failed", exc_info=exc)
        # Fallback to mock data if search fails
        events = [] 
        # You might want to add build_events_from_mock here if you want fallback behavior
        
    if not events:
         # Fallback to mock if no results
        events = []
        # Mock fallback logic removed for now to strictly use search results or empty

    summary_text = await summarize_event_news(request.date, request.stock_name, events)

    cache_payload = {
        "events": [event.dict() for event in events],
        "summary": summary_text,
    }
    await cache_setex(cache_key, 7 * 24 * 3600, json.dumps(cache_payload, ensure_ascii=False))

    return EventSearchResponse(
        date=request.date,
        stock_name=request.stock_name,
        events=events,
        summary=summary_text,
        cached=False,
    )

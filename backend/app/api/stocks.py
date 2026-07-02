import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List

import aiohttp
import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from redis.exceptions import RedisError

from app.logger import get_logger
from app.stores.session_store import SessionStore
from app.utils import call_llm_summary
from app.data.mock_stock_news import get_mock_stock_news
from app.services.search_service import search_news

log = get_logger(__name__)
router = APIRouter(prefix="/api/stocks", tags=["stocks"])

# Initialize session store for caching
session_store = SessionStore()
STOCK_DATA_CACHE_VERSION = "v4_kor_summary"


async def redis_get(key: str) -> Optional[str]:
    try:
        return await session_store.client.get(key)
    except RedisError as exc:
        log.warning("Redis unavailable when reading %s - continuing without cache", key, exc_info=exc)
        return None


async def redis_setex(key: str, ttl: int, value: str) -> None:
    try:
        await session_store.client.setex(key, ttl, value)
    except RedisError as exc:
        log.warning("Redis unavailable when writing %s - skipping cache write", key, exc_info=exc)


async def summarize_stock_profile(name: Optional[str], description: Optional[str]) -> Optional[str]:
    """Use the default OpenRouter model to summarize long English blurbs into 2-3 Korean sentences."""
    if not description:
        return None

    try:
        prompt = (
            "다음은 기업 설명입니다.\n"
            "1) 한국어로 2~3문장으로 요약하고,\n"
            "2) 투자 포인트와 사업 핵심을 간결하게 전달해 주세요.\n\n"
            f"기업명: {name or '해당 기업'}\n"
            f"설명:\n{description}\n"
        )

        completion = await call_llm_summary(
             [
                {"role": "system", "content": "당신은 금융 데이터를 한국어로 간결하게 요약하는 애널리스트입니다."},
                {"role": "user", "content": prompt},
            ],
            model=os.getenv("LLM_SUMMARIZE", "google/gemini-2.5-flash"),
            temperature=0.2,
            max_tokens=220,
        )
        return completion
    except Exception as exc:
        log.warning("Failed to summarize stock profile description", exc_info=exc)
        return None

class StockInfoResponse(BaseModel):
    ticker: str
    name: Optional[str] = None
    description: Optional[str] = None
    market_cap: Optional[int] = None
    per: Optional[float] = None
    eps: Optional[float] = None
    roe: Optional[float] = None
    currency: Optional[str] = None
    cached: bool = False

def get_stock_info_sync(ticker: str) -> dict:
    """
    Synchronously fetch stock info using yfinance.
    Handles Korean stock suffixes (.KS, .KQ) if the ticker is numeric.
    """
    try:
        # If ticker is all digits, try appending suffixes
        candidates = [ticker]
        if ticker.isdigit():
            candidates = [f"{ticker}.KS", f"{ticker}.KQ"]
        
        stock = None
        info = {}
        
        for symbol in candidates:
            try:
                s = yf.Ticker(symbol)
                # Accessing .info triggers the fetch
                i = s.info
                # Check if we got valid data (sometimes yfinance returns empty dict or minimal data for invalid tickers)
                if i and 'symbol' in i:
                    stock = s
                    info = i
                    break
            except Exception as e:
                log.warning(f"Failed to fetch info for {symbol}: {e}")
                continue
        
        if not info:
            raise ValueError(f"Could not find stock data for {ticker}")

        return {
            "ticker": ticker,
            "resolved_ticker": info.get("symbol", ticker),
            "name": info.get("longName") or info.get("shortName"),
            "description": info.get("longBusinessSummary"),
            "market_cap": info.get("marketCap"),
            "per": info.get("trailingPE") or info.get("forwardPE"),
            "eps": info.get("trailingEps") or info.get("forwardEps"),
            "roe": info.get("returnOnEquity"),
            "currency": info.get("currency")
        }

    except Exception as e:
        log.error(f"Error fetching stock info: {e}")
        raise

@router.get("/{ticker}", response_model=StockInfoResponse)
async def get_stock_info(ticker: str):
    """
    Get stock information (Description, Market Cap, PER, EPS, ROE).
    Automatically handles Korean stock codes (tries .KS and .KQ).
    Cached in Redis, updates once a day.
    """
    try:
        today_str = datetime.now().strftime("%Y-%m-%d")
        cache_key = f"stock_info:{STOCK_DATA_CACHE_VERSION}:{ticker}"
        
        # 1. Check Cache
        cached_data = await redis_get(cache_key)
        if cached_data:
            try:
                cached_json = json.loads(cached_data)
                last_updated = cached_json.get("last_updated")
                
                # Use cache if it was updated today
                if last_updated == today_str:
                    log.info(f"Cache hit for {cache_key} (updated today)")
                    return StockInfoResponse(**cached_json["data"], cached=True)
                else:
                    log.info(f"Cache hit for {cache_key} but outdated ({last_updated} != {today_str}). Fetching new data.")
            except json.JSONDecodeError:
                log.warning(f"Failed to parse cached data for {cache_key}")

        # 2. Fetch from Source
        data = get_stock_info_sync(ticker)
        
        summarized_description = await summarize_stock_profile(data.get("name"), data.get("description"))

        response_data = {
            "ticker": data["resolved_ticker"],
            "name": data["name"],
            "description": summarized_description or data["description"],
            "market_cap": data["market_cap"],
            "per": data["per"],
            "eps": data["eps"],
            "roe": data["roe"],
            "currency": data["currency"]
        }
        
        # 3. Save to Cache
        cache_payload = {
            "last_updated": today_str,
            "data": response_data
        }
        # Set TTL to 48 hours (to ensure we have 'yesterday's' data if needed, but we overwrite if date changes)
        await redis_setex(cache_key, 48 * 3600, json.dumps(cache_payload))
        
        return StockInfoResponse(**response_data, cached=False)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        log.error(f"Error in get_stock_info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# --- Stock News Feature ---


class NewsItem(BaseModel):
    title: str
    url: str
    source: str
    date: Optional[str] = None


class StockNewsResponse(BaseModel):
    ticker: str
    summary: Optional[str] = None
    news: List[NewsItem]
    cached: bool = False


async def summarize_stock_news(stock_name: str, news_items: List[NewsItem]) -> Optional[str]:
    if not news_items:
        return None
    
    try:
        articles_text = []
        for idx, item in enumerate(news_items[:5], start=1):
            articles_text.append(f"{idx}. {item.title} ({item.source})")
        
        text_block = "\n".join(articles_text)
        
        prompt = (
            f"다음은 '{stock_name}'에 대한 최신 뉴스 헤드라인입니다:\n\n"
            f"{text_block}\n\n"
            "이 뉴스들을 바탕으로 현재 이 기업의 가장 중요한 이슈나 동향을 1~2문장으로 간략하게 요약해주세요. "
            "금융 전문가의 어조로 작성해 주세요."
        )

        messages = [
            {"role": "system", "content": "당신은 금융 정보를 간결하게 요약하는 AI 어시스턴트입니다."},
            {"role": "user", "content": prompt},
        ]
        return await call_llm_summary(
            messages,
            model=os.getenv("LLM_SUMMARIZE", "google/gemini-2.5-flash"),
            temperature=0.2,
            max_tokens=150,
        )
    except Exception as e:
        log.error(f"Error summarizing news: {e}")
        return None

@router.get("/{ticker}/news", response_model=StockNewsResponse)
async def get_stock_news(ticker: str, name: Optional[str] = None):
    """
    Fetch recent company news via Web Search, summarize headlines, and cache the result.
    """
    search_term = name if name else ticker
    cache_key = f"stock_news:{STOCK_DATA_CACHE_VERSION}:{ticker}"

    # 1. Check cache
    cached_data = await redis_get(cache_key)
    if cached_data:
        try:
            cached_json = json.loads(cached_data)
            log.info(f"Cache hit for {cache_key}")
            return StockNewsResponse(**cached_json, cached=True)
        except Exception:
            pass

    try:
        # Perform Web Search for recent news
        query = f"{search_term} 주식 뉴스"
        raw_results = await search_news(
            query=query,
            recency_days=3, # Last 3 days
            response_length="medium"
        )
        
        news_items: List[NewsItem] = []
        for item in raw_results:
            news_items.append(
                NewsItem(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    source=item.get("source", "Web"),
                    date=item.get("date")
                )
            )

    except Exception as exc:
        log.warning("Web search news fetch failed; falling back to mock data", exc_info=exc)
        fallback_payload = get_mock_stock_news(ticker, search_term)
        if fallback_payload:
            await redis_setex(cache_key, 1800, json.dumps(fallback_payload))
            return StockNewsResponse(**fallback_payload)
        fallback_label = search_term or ticker
        return StockNewsResponse(
            ticker=ticker,
            summary=f"Unable to load recent news for {fallback_label}.",
            news=[],
            cached=False,
        )

    if not news_items:
        fallback_payload = get_mock_stock_news(ticker, search_term)
        if fallback_payload:
            await redis_setex(cache_key, 1800, json.dumps(fallback_payload))
            return StockNewsResponse(**fallback_payload)
        return StockNewsResponse(ticker=ticker, news=[], summary="최근 3일간 검색된 주요 뉴스가 없습니다.")

    summary = await summarize_stock_news(search_term, news_items)
    response_obj = {
        "ticker": ticker,
        "summary": summary,
        "news": [item.dict() for item in news_items],
        "cached": False,
    }

    await redis_setex(cache_key, 10800, json.dumps({**response_obj, "cached": True}))
    return StockNewsResponse(**response_obj)


@router.get("/history")
async def get_stock_history(symbol: str, date_from: str, date_to: str, page_size: int = 100):
    """
    Get historical stock data (candles) using yfinance.
    """
    try:
        # Resolve ticker (handle .KS/.KQ for Korean stocks)
        if symbol.isdigit():
            ticker = f"{symbol}.KS"
        else:
            ticker = symbol
        
        # Check cache
        cache_key = f"stock_history:{STOCK_DATA_CACHE_VERSION}:{ticker}:{date_from}:{date_to}"
        cached_data = await redis_get(cache_key)
        if cached_data:
            try:
                return json.loads(cached_data)
            except json.JSONDecodeError:
                pass

        # Fetch from yfinance
        # yfinance expects YYYY-MM-DD
        df = yf.download(ticker, start=date_from, end=date_to, progress=False)
        
        if df.empty:
            # Fallback or empty return
            return {"data": []}
        
        # Reset index to get Date as column
        df = df.reset_index()
        
        # Format data for frontend
        data = []
        for _, row in df.iterrows():
            # Handle different column naming conventions in yfinance versions
            date_val = row.get("Date")
            if date_val:
                date_str = date_val.strftime("%Y-%m-%d")
            else:
                continue
                
            # Safe float conversion
            def get_val(col):
                val = row.get(col)
                if val is None: return 0
                try:
                    return float(val)
                except:
                    return 0

            data.append({
                "date": date_str,
                "open": get_val("Open"),
                "high": get_val("High"),
                "low": get_val("Low"),
                "close": get_val("Close"),
                "volume": int(get_val("Volume")),
                "price": get_val("Close"), # Frontend expects 'price' sometimes
            })
            
        result = {"data": data}
        
        # Cache for 24 hours
        await redis_setex(cache_key, 86400, json.dumps(result))
        
        return result

    except Exception as e:
        log.error(f"Error fetching stock history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

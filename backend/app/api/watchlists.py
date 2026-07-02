from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4

from app.stores.watchlist_store import WatchlistStore


router = APIRouter(prefix="/watchlists", tags=["watchlists"])
watchlist_store = WatchlistStore()


class WatchlistStock(BaseModel):
    id: Optional[str] = None
    ticker: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    market: Optional[str] = None
    sector: Optional[str] = None
    marketCap: Optional[str] = None
    price: Optional[str | float] = None
    changePercent: Optional[str | float] = None
    currency: Optional[str] = None


class WatchlistUpdateRequest(BaseModel):
    stocks: List[WatchlistStock]


class WatchlistResponse(BaseModel):
    stocks: List[WatchlistStock]


def _normalize_stock(stock: WatchlistStock) -> WatchlistStock:
    normalized = WatchlistStock(
        id=(stock.id or str(uuid4())).strip(),
        ticker=stock.ticker.strip().upper(),
        name=stock.name.strip(),
        market=(stock.market or "").strip().upper() or None,
        sector=(stock.sector or "").strip() or None,
        marketCap=(stock.marketCap or "").strip() or None,
        price=stock.price,
        changePercent=stock.changePercent,
        currency=(stock.currency or "").strip().upper() or None,
    )
    return normalized


@router.get("/user/{user_id}", response_model=WatchlistResponse)
async def get_user_watchlist(user_id: str) -> WatchlistResponse:
    stocks = await watchlist_store.get_watchlist(user_id)
    if not stocks:
        return WatchlistResponse(stocks=[])
    return WatchlistResponse(stocks=stocks)


@router.put("/user/{user_id}", response_model=WatchlistResponse)
async def update_user_watchlist(user_id: str, payload: WatchlistUpdateRequest) -> WatchlistResponse:
    if not payload.stocks:
        raise HTTPException(status_code=400, detail="At least one stock entry is required.")

    seen = set()
    normalized: List[WatchlistStock] = []
    for stock in payload.stocks:
        normalized_stock = _normalize_stock(stock)
        if not normalized_stock.ticker or not normalized_stock.name:
            continue
        if normalized_stock.ticker in seen:
            raise HTTPException(status_code=400, detail=f"Duplicated ticker: {normalized_stock.ticker}")
        seen.add(normalized_stock.ticker)
        normalized.append(normalized_stock)

    if not normalized:
        raise HTTPException(status_code=400, detail="No valid stock entries provided.")

    await watchlist_store.save_watchlist(
        user_id,
        [stock.model_dump() for stock in normalized],
    )

    return WatchlistResponse(stocks=normalized)

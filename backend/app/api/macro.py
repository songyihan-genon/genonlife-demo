
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/macro", tags=["macro"])

FRED_API_KEY = os.getenv("FRED_API_KEY")
FRED_BASE_URL = "https://api.stlouisfed.org/fred"

MACRO_INDICATORS = {
    "US10Y":      { "name": "미국채 10년물 금리", "provider": "FRED", "series_id": "DGS10",      "freq": "D" },
    "FEDFUNDS":   { "name": "미 연준 기준금리", "provider": "FRED", "series_id": "DFEDTARU",   "freq": "D" },
    "REAL10Y":    { "name": "미국 실질금리 (10Y)", "provider": "FRED", "series_id": "DFII10",     "freq": "D" },
    "USD_KRW":    { "name": "원/달러 환율", "provider": "FRED", "series_id": "DEXKOUS",    "freq": "D" },
    "DOLLAR_IDX": { "name": "달러 인덱스 (주요국)", "provider": "FRED", "series_id": "DTWEXBGS",   "freq": "D" },
    "JPY_USD":    { "name": "엔/달러 환율", "provider": "FRED", "series_id": "DEXJPUS",    "freq": "D" },
    "WTI":        { "name": "WTI 유가", "provider": "FRED", "series_id": "DCOILWTICO", "freq": "D" },
    "VIX":        { "name": "VIX 변동성 지수", "provider": "FRED", "series_id": "VIXCLS",     "freq": "D" },
    "RRP":        { "name": "역레포 (Overnight RRP)", "provider": "FRED", "series_id": "RRPONTSYD",  "freq": "D" },
}

@router.get("/list")
async def get_macro_list():
    """
    지원하는 매크로 지표 목록을 반환합니다.
    """
    return [
        {"id": key, **value} for key, value in MACRO_INDICATORS.items()
    ]

@router.get("/{indicator_id}/history")
async def get_macro_history(
    indicator_id: str,
    days: int = Query(default=45, ge=1, le=3650),
):
    """
    특정 매크로 지표의 히스토리 데이터를 FRED API에서 가져옵니다.
    """
    indicator = MACRO_INDICATORS.get(indicator_id)
    if not indicator:
        raise HTTPException(status_code=404, detail="Macro indicator not found")
    
    if indicator["provider"] != "FRED":
         raise HTTPException(status_code=400, detail="Only FRED provider is supported currently")

    if not FRED_API_KEY:
        raise HTTPException(status_code=500, detail="FRED_API_KEY is not configured")

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    params = {
        "series_id": indicator["series_id"],
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "observation_start": start_date.strftime("%Y-%m-%d"),
        "observation_end": end_date.strftime("%Y-%m-%d"),
        "sort_order": "asc"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FRED_BASE_URL}/series/observations",
                params=params,
                timeout=10.0
            )
            
            if response.status_code != 200:
                print(f"FRED API Error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from FRED")
            
            data = response.json()
            observations = data.get("observations", [])
            
            # 데이터 가공
            result = []
            for obs in observations:
                date_str = obs["date"]
                value_str = obs["value"]
                
                # "." 등 유효하지 않은 값 필터링
                if value_str == ".":
                    continue
                    
                try:
                    value = float(value_str)
                    result.append({
                        "time": date_str,
                        "value": value
                    })
                except ValueError:
                    continue
            
            # 요청된 기간에 맞게 필터링 (FRED API가 start_date 이전 데이터도 일부 줄 수 있으므로)
            # 여기서는 클라이언트가 요청한 days에 최대한 맞추되, 데이터가 적으면 그대로 반환
            
            return result

    except httpx.RequestError as e:
        print(f"FRED API Request Error: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")
    except Exception as e:
        print(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


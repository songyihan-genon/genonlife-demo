from typing import List, Optional, Dict, Any

NewsItemDict = Dict[str, Any]

MOCK_STOCK_NEWS: Dict[str, Dict[str, Any]] = {
    "005380": {
        "name": "현대차",
        "summary": "{name} 관련 최근 이슈는 미국 조지아 공장 법적·노동 리스크와 EV 투자 확대 전략에 초점이 맞춰져 있습니다.",
        "news": [
            {
                "title": "현대차, 조지아 EV 공장 관련 추가 안전 점검 착수",
                "url": "https://news.example.com/hyundai-safety-check",
                "source": "가상경제",
                "date": "2025-09-15",
            },
            {
                "title": "현대차, 북미 전기차 라인업 확대 위해 2조원 추가 투자",
                "url": "https://news.example.com/hyundai-ev-investment",
                "source": "비즈타임즈",
                "date": "2025-09-14",
            },
            {
                "title": "현대차, 한미 정부와 노동·비자 문제 협의 착수",
                "url": "https://news.example.com/hyundai-labor-update",
                "source": "정책일보",
                "date": "2025-09-13",
            },
        ],
    },
    "005930": {
        "name": "삼성전자",
        "summary": "{name}는 HBM 증설과 AI 서버 수요 확대 기대감으로 투자자 관심이 집중되고 있습니다.",
        "news": [
            {
                "title": "삼성전자, 차세대 HBM4 양산 준비 속도",
                "url": "https://news.example.com/samsung-hbm4",
                "source": "테크투데이",
                "date": "2025-09-12",
            },
            {
                "title": "삼성전자, 美 고객사와 AI 메모리 공급 협력 강화",
                "url": "https://news.example.com/samsung-ai-memory",
                "source": "AI데일리",
                "date": "2025-09-11",
            },
            {
                "title": "삼성전자, 반도체 업황 회복 기대에 주가 반등",
                "url": "https://news.example.com/samsung-share-rebound",
                "source": "마켓인사이트",
                "date": "2025-09-10",
            },
        ],
    },
}


def get_mock_stock_news(ticker: str, stock_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    payload = MOCK_STOCK_NEWS.get(ticker)
    if not payload:
        return None

    name = stock_name or payload.get("name") or "해당 기업"
    summary_template = payload.get("summary") or f"{name} 관련 최근 이슈 요약입니다."
    summary = summary_template.replace("{name}", name)

    news_list: List[NewsItemDict] = payload.get("news", [])
    sanitized_news = [
        {
            "title": item.get("title", f"{name} 관련 소식"),
            "url": item.get("url", ""),
            "source": item.get("source", "MockNews"),
            "date": item.get("date"),
        }
        for item in news_list
    ]

    return {
        "ticker": ticker,
        "summary": summary,
        "news": sanitized_news,
        "cached": True,
    }

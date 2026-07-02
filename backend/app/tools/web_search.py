import aiohttp
import asyncio
import os
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import Literal, Optional, Union

from app.logger import get_logger
from app.utils import States

log = get_logger(__name__)


class SingleSearchModel(BaseModel):
    query: str = Field(description="search string (use the language that's most likely to match the sources)")
    recency: Optional[Union[int, str]] = Field(description="limit to recent N **days**, or null, The value for the recency must be an *integer type*, specified in days. For example, if you want to find information within 1 year, you must enter it in days, like ** recency: 365 **", default=None)
    domains: Optional[list[str]] = Field(description='restrict to domains (e.g. ["example.com", "another.com"], or null)', default=None)


class MultipleSearchModel(BaseModel):
    search_query: list[SingleSearchModel] = Field(description="array of search query objects. You can call this tool with multiple search queries to get more results faster.")
    response_length: Literal["short", "medium", "long"] = Field(description="response length option", default="medium")


WEB_SEARCH = {
    "type": "function",
    "function": {
        "name": "search",
        "description": "Search the web for information. Returns up to 5/10/15 results for short/medium/long.",
        "parameters": {
            "type": "object",
            "properties": {
                "search_query": {
                    "type": "array",
                    "items": SingleSearchModel.model_json_schema(),
                    "description": "array of search query objects. You can call this tool with multiple search queries to get more results faster."
                },
                "response_length": {
                    "type": "string",
                    "enum": ["short", "medium", "long"],
                    "default": "medium",
                    "description": "response length option"
                }
            },
            "required": ["search_query"]
        }
    }
}


# Final result caps per response length
FINAL_SIZE_MAP = {"short": 5, "medium": 10, "long": 15}
SEARCH_URL = "https://www.searchapi.io/api/v1/search"


async def web_search(
    states: States,
    **tool_input
) -> str:
    api_key = os.getenv("SEARCHAPI_KEY")
    if not api_key:
        msg = "SEARCHAPI_KEY is not set; web_search cannot be executed. Please configure the API key."
        log.error(msg)
        return msg

    try:
        tool_input = MultipleSearchModel(**tool_input)
    except Exception as e:
        return f"Error validating `web_search`: {e}"

    async with aiohttp.ClientSession() as session:
        tasks = [(
            sq.query,
            single_search(
                session,
                sq.query,
                api_key,
                sq.recency,
                sq.domains,
                tool_input.response_length
            )) for sq in tool_input.search_query]
        results = await asyncio.gather(*[task[1] for task in tasks], return_exceptions=True)

    errors = []
    filtered_results = []
    for (query, _), result in zip(tasks, results):
        if isinstance(result, Exception):
            log.error("web_search single_search failed", extra={"query": query, "error": str(result)})
            errors.append(f"{query}: {result}")
            continue
        filtered_results.append((query, result))

    if errors and not filtered_results:
        return "Web search failed. " + "; ".join(errors) + " Check SEARCHAPI_KEY and outbound network connectivity."

    # Flatten results from multiple queries
    flatted_res = []
    seen_urls = set()
    for (query, result_list) in filtered_results:
        for item in result_list:
            # De-duplicate by URL (preserve order)
            url = item.get('url')
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            flatted_res.append({**item, "query": query})
    # Cap total results by response length
    limit = FINAL_SIZE_MAP.get(tool_input.response_length, 10)
    flatted_res = flatted_res[:limit]
    
    outputs = []
    for idx, item in enumerate(flatted_res):
        id = f'{states.turn}:{idx}'
        enriched = {
            "id": id,
            **item,
        }
        states.tool_state.id_to_url[id] = item['url']
        states.tool_results[id] = enriched
        outputs.append(enriched)
    
    states.turn += 1
    
    return "\n".join([
        f'- 【{item["id"]}†{item["title"]}†{item["source"]}】: {item["date"]} — {item["snippet"]}' if item['date'] else
        f'- 【{item["id"]}†{item["title"]}†{item["source"]}】: {item["snippet"]}'
        for item in outputs
    ])


async def single_search(
    session: aiohttp.ClientSession,
    query: str,
    api_key: str,
    recency: Optional[int] = None,
    domains: Optional[list[str]] = None,
    response_length: Literal["short", "medium", "long"] = "medium",
):
    url = SEARCH_URL

    if domains:
        query = f"{query} site:{' OR site:'.join(domains)}"
    
    if response_length not in {"short", "medium", "long"}:
        raise ValueError("response_length must be 'short'|'medium'|'long'")
    
    size_map = {"short": 3, "medium": 5, "long": 7}
    
    num = size_map[response_length]
    params = {
        "engine": "google",
        "api_key": api_key,
        "q": query,
        "num": num
    }

    if recency:
        if isinstance(recency, str):
            recency = duration_to_days(recency.replace(" ", ''))
        params["time_period_min"] = (datetime.now() - timedelta(days=recency)).strftime("%m/%d/%Y")

    async with session.get(url, params=params) as resp:
        resp.raise_for_status()
        data = await resp.json()
        organic_results = data.get('organic_results', [])

        from urllib.parse import urlparse
        results = []
        for item in organic_results:
            # Defensive parsing with fallbacks
            title = item.get("title") or item.get("headline") or item.get("link") or "(no title)"
            url_value = item.get("link") or item.get("url") or ""
            snippet = item.get("snippet") or item.get("description") or item.get("content") or ""

            # Derive source from domain if missing
            source = item.get("source")
            if not source:
                try:
                    netloc = urlparse(url_value).netloc
                    source = netloc or "unknown"
                except Exception:
                    source = "unknown"

            results.append(
                {
                    "title": title,
                    "url": url_value,
                    "snippet": snippet,
                    "source": source,
                    "date": item.get("date", None),
                }
            )
        return results


def duration_to_days(duration_string):
    """
    "2y", "3M", "2d"와 같은 기간 문자열을 일(days) 단위로 변환합니다.
    - 1년은 365일로 가정합니다.
    - 1개월은 30일로 가정합니다.
    - 1일은 1일입니다.
    """
    import re
    # 단위별 일 수 정의
    units = {
        "y": 365,
        "Y": 365,
        "M": 30, # 평균값 사용
        "d": 1,
        "D": 1
    }
    
    total_days = 0
    # 정규 표현식을 사용하여 숫자와 단위를 찾습니다 (예: ('1', 'y'), ('3', 'M'))
    matches = re.findall(r"(\d+)([yYmMdD])", duration_string)
    
    for value_str, unit in matches:
        try:
            value = int(value_str)
            if unit in units:
                total_days += value * units[unit]
        except ValueError:
            # 숫자로 변환 중 오류가 발생하면 건너뜁니다.
            continue
            
    return total_days

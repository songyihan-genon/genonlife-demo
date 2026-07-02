import os
import json
import random
import logging
import re
import html
from urllib.parse import urlparse
import aiohttp
import redis
from datetime import datetime
from zoneinfo import ZoneInfo
from app.schemas import Insight
from app.utils import CLIENT
from app.tools.open_url import open_url

# Configure Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except Exception as e:
    print(f"Redis connection failed: {e}")
    redis_client = None

log = logging.getLogger("uvicorn")

class InsightService:
    def __init__(self):
        self.redis = redis_client

    def _extract_domain(self, url: str) -> str:
        try:
            domain = urlparse(url).netloc or url
            if domain.startswith("www."):
                domain = domain[4:]
            return domain or url
        except Exception:
            return url

    def _apply_tool_state_citations(self, text: str, tool_state: dict | None, add_sources_section: bool = True) -> str:
        """Replace citation markers with inline links using captured tool_state URLs."""
        if not text or not tool_state:
            return text

        id_to_url = (tool_state or {}).get("id_to_url") or {}
        if not id_to_url:
            return text

        used_urls: list[str] = []
        seen_urls: set[str] = set()

        def replace(match: re.Match) -> str:
            body = match.group(0)[1:-1]
            ids = re.findall(r"\d+:\d+", body)
            links: list[str] = []
            for citation_id in ids:
                url = id_to_url.get(citation_id)
                if not url:
                    continue
                domain = html.escape(self._extract_domain(url))
                safe_url = html.escape(url, quote=True)
                links.append(
                    f"<a href=\"{safe_url}\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"citation-chip\">{domain}</a>"
                )
                if url not in seen_urls:
                    seen_urls.add(url)
                    used_urls.append(url)
            return (" " + " ".join(links) + " ") if links else " "

        updated_text = re.sub(r"【[^】]+】", replace, text)

        if used_urls and add_sources_section:
            sources_lines = ["", "## 참고 자료"]
            for url in used_urls:
                domain = self._extract_domain(url)
                sources_lines.append(f"- [{domain}]({url})")
            updated_text = updated_text.rstrip() + "\n\n" + "\n".join(sources_lines).strip() + "\n"

        return updated_text

    def _remove_citation_markers(self, text: str) -> str:
        if not text:
            return text
        return re.sub(r"【[^】]+】", "", text)

    async def search_web(self, query: str) -> list[dict]:
        """
        Search the web using SearchApi.
        """
        api_key = os.getenv("SEARCHAPI_KEY")
        if not api_key:
            log.warning("SEARCHAPI_KEY not found, skipping search")
            return []

        url = "https://www.searchapi.io/api/v1/search"
        params = {
            "engine": "google",
            "q": query,
            "api_key": api_key,
            "num": 5
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    if resp.status != 200:
                        log.error(f"Search API failed: {await resp.text()}")
                        return []
                    data = await resp.json()
                    return data.get("organic_results", [])
        except Exception as e:
            log.error(f"Search error: {e}")
            return []

    async def deep_dive_analysis(self, topic: str) -> str:
        """
        Search for the topic and scrape top results for detailed context.
        """
        log.info(f"Deep diving into: {topic}")
        
        # 1. Search for the topic
        search_results = await self.search_web(topic)
        if not search_results:
            return ""

        # 2. Select top 1-2 URLs to scrape
        context = []
        for result in search_results[:2]:
            link = result.get("link")
            if not link:
                continue
            
            try:
                log.info(f"Scraping: {link}")
                # Use open_url tool to scrape
                page_content = await open_url(link, 0)
                context.append(f"Source: {result.get('title')} ({link})\nContent:\n{page_content.text[:2000]}...") # Limit context size
            except Exception as e:
                log.error(f"Failed to scrape {link}: {e}")
                continue
        
        return "\n\n".join(context)

    async def fetch_daily_trend(self) -> str:
        """
        Identify a daily market trend using real search with current date context.
        """
        # Get current date in KST
        now_kst = datetime.now(ZoneInfo("Asia/Seoul"))
        current_date = now_kst.strftime("%Y년 %m월 %d일")
        
        # Search for latest tech/market trends with date context
        search_query = f"{current_date} 최신 기술 시장 트렌드"
        trends = await self.search_web(search_query)
        
        if trends:
            # Pick a random top result title as the topic
            topic = random.choice(trends[:3]).get("title")
            return topic
        
        # Fallback if search fails
        topics = [
            "AI 반도체 수요 폭발과 HBM 시장 전망",
            "자율주행 레벨4 상용화와 규제 완화",
            "생성형 AI의 기업 도입 가속화",
            "전기차 배터리 시장의 차세대 기술 경쟁"
        ]
        return random.choice(topics)

    async def fetch_research_report(self, topic: str) -> dict:
        """
        Fetch a comprehensive research report from /chat/research API along with tool_state.
        """
        log.info(f"Fetching research report for: {topic}")
        
        # Get current date/time in KST
        now_kst = datetime.now(ZoneInfo("Asia/Seoul"))
        current_datetime = now_kst.strftime("%Y년 %m월 %d일 %H시 %M분")
        
        # Prepare research request
        research_query = f"{current_datetime} 기준, {topic}에 대한 최신 시장 동향과 전망을 상세히 분석해주세요."
        
        try:
            # Call internal research API
            url = "http://localhost:5588/chat/research"
            payload = {
                "question": research_query,
                "chatId": None
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as resp:
                    if resp.status != 200:
                        log.error(f"Research API failed: {await resp.text()}")
                        return {"report": "", "tool_state": None}
                    
                    # The API returns SSE stream, collect text content only
                    full_response = []
                    char_count = 0
                    max_chars = 10000  # Limit to ~2500 tokens to avoid overflow
                    
                    latest_tool_state = None
                    async for line in resp.content:
                        if char_count >= max_chars:
                            break
                            
                        line_text = line.decode('utf-8').strip()
                        if not line_text.startswith('data: '):
                            continue

                        data_str = line_text[6:]  # Remove 'data: ' prefix
                        if not data_str or data_str == '[DONE]':
                            continue

                        try:
                            data_obj = json.loads(data_str)
                        except json.JSONDecodeError:
                            full_response.append(data_str)
                            char_count += len(data_str)
                            continue
                        except Exception as e:
                            log.warning(f"Failed to parse SSE data: {e}")
                            continue

                        if isinstance(data_obj, dict) and 'event' in data_obj:
                            event_type = data_obj.get('event')
                            event_data = data_obj.get('data')
                            if event_type == 'token' and isinstance(event_data, str):
                                text_chunk = event_data
                                full_response.append(text_chunk)
                                char_count += len(text_chunk)
                            elif event_type == 'tool_state' and isinstance(event_data, dict):
                                latest_tool_state = event_data

                    result = ''.join(full_response)
                    log.info(f"Research report collected: {len(result)} characters")
                    return {
                        "report": result[:max_chars],  # Ensure we don't exceed limit
                        "tool_state": latest_tool_state
                    }
                        
        except Exception as e:
            log.error(f"Research API error: {e}")
            return {"report": "", "tool_state": None}


    async def generate_insight(self, topic: str = None) -> Insight:
        if not topic:
            topic = await self.fetch_daily_trend()

        log.info(f"Generating insight for topic: {topic}")

        # Get current date/time in KST
        now_kst = datetime.now(ZoneInfo("Asia/Seoul"))
        current_datetime = now_kst.strftime("%Y년 %m월 %d일 %H시 %M분")
        current_date = now_kst.strftime("%Y-%m-%d")

        # Fetch comprehensive research report (and captured tool state)
        research_data = await self.fetch_research_report(topic)
        citation_tool_state = None
        if isinstance(research_data, dict):
            research_report = research_data.get("report", "")
            citation_tool_state = research_data.get("tool_state")
        else:
            research_report = research_data or ""
        
        # Prompt for LLM with markdown output
        prompt = f"""
        당신은 금융/산업 전문 AI 애널리스트입니다.
        현재 시각: {current_datetime} (KST)
        
        주제: '{topic}'에 대한 심층적인 시장 분석 인사이트 리포트를 작성해주세요.
        
        참고 자료 (Research Report):
        {research_report}
        
        위 참고 자료를 바탕으로 구체적인 수치와 사실을 포함하여 작성해주세요.
        
        다음 JSON 형식으로 출력해주세요. Markdown 포맷을 사용하지 말고 순수 JSON만 출력하세요.
        
        {{
            "title": "매력적인 제목",
            "summary": "2-3문장 요약",
            "content": "Markdown 형식의 본문 내용. ## 제목, ### 소제목, - 리스트, **강조** 등을 사용하여 구조화된 아티클. 섹션을 나누어 작성.",
            "category": "산업 카테고리 (예: 반도체, AI, 자동차 등)",
            "tags": ["태그1", "태그2", "태그3"],
            "read_time": "예상 읽기 시간 (예: 3분)",
            "related_companies": [
                {{
                    "name": "기업명",
                    "code": "종목코드(한국/미국)",
                    "impact": "positive 또는 negative",
                    "reason": "수혜/피해 이유 한줄 요약"
                }}
            ]
        }}
        
        분석 내용은 전문적이고 깊이 있어야 하며, 투자자 관점에서 작성되어야 합니다.
        현재 시각({current_datetime})을 고려하여 최신 정보를 반영해주세요.
        """

        try:
            # Use Pydantic structured output for reliable parsing
            from pydantic import BaseModel, Field
            from typing import List
            
            class RelatedCompany(BaseModel):
                name: str
                code: str
                impact: str
                reason: str
            
            class InsightResponse(BaseModel):
                title: str = Field(description="매력적인 제목")
                summary: str = Field(description="2-3문장 요약")
                content: str = Field(description="Markdown 형식의 본문 내용")
                category: str = Field(description="산업 카테고리")
                tags: List[str] = Field(description="태그 리스트")
                read_time: str = Field(description="예상 읽기 시간")
                related_companies: List[RelatedCompany] = Field(description="관련 기업 리스트")
            
            completion = await CLIENT.beta.chat.completions.parse(
                model=os.getenv("DEFAULT_MODEL", "gpt-4o"),
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                response_format=InsightResponse
            )
            
            parsed = completion.choices[0].message.parsed
            log.info(f"Successfully parsed insight: {parsed.title}")
            
            processed_summary = self._remove_citation_markers(parsed.summary)
            processed_content = self._apply_tool_state_citations(parsed.content, citation_tool_state, add_sources_section=True)

            insight = Insight(
                id=now_kst.strftime("%Y%m%d%H%M%S"),
                title=parsed.title,
                summary=processed_summary,
                content=processed_content,
                category=parsed.category,
                tags=parsed.tags,
                generated_at=current_date,
                read_time=parsed.read_time,
                related_companies=[
                    {
                        "name": c.name,
                        "code": c.code,
                        "impact": c.impact,
                        "reason": c.reason
                    } for c in parsed.related_companies
                ]
            )
            
            # Save to Redis
            self.save_insight(insight)
            return insight

        except Exception as e:
            log.error(f"Error generating insight: {e}")
            raise e

    def save_insight(self, insight: Insight):
        if not self.redis:
            log.warning("Redis not available, skipping save")
            return
            
        # Save latest
        self.redis.set("insight:latest", insight.model_dump_json())
        
        # Add to history list (prepend)
        self.redis.lpush("insight:history", insight.model_dump_json())
        # Keep only last 30 days
        self.redis.ltrim("insight:history", 0, 29)

    def get_latest_insight(self) -> Insight:
        if not self.redis:
            return None
            
        data = self.redis.get("insight:latest")
        if data:
            return Insight.model_validate_json(data)
        return None

    def get_insight_history(self) -> list[Insight]:
        if not self.redis:
            return []
            
        data_list = self.redis.lrange("insight:history", 0, -1)
        return [Insight.model_validate_json(data) for data in data_list]

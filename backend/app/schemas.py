from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Insight(BaseModel):
    id: str
    title: str
    summary: str
    content: str  # HTML or Markdown content
    category: str
    tags: List[str]
    generated_at: str
    read_time: str
    thumbnail: Optional[str] = None
    
    # Related companies
    related_companies: List[dict] = [] # [{"name": "Samsung", "code": "005930", "impact": "positive"}]

class InsightCreate(BaseModel):
    topic: Optional[str] = None # Optional manual topic override

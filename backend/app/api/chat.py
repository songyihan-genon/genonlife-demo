from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict

from app.services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()


class GenerateRequest(BaseModel):
    question: str
    chatId: str | None = None
    userInfo: dict | None = None
    model_config = ConfigDict(extra='allow')


@router.post("/chat/research")
async def chat_research(
    req: GenerateRequest, 
    request: Request
) -> StreamingResponse:
    """
    SSE 프로토콜을 사용하여 채팅 스트리밍을 제공합니다.
    """
    return StreamingResponse(
        chat_service.stream_chat(req, request.is_disconnected), 
        media_type="text/event-stream", 
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )

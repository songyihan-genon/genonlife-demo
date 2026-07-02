import asyncio
import json
import os
import re
from datetime import datetime
from uuid import uuid4
from typing import AsyncGenerator, Any

from app.utils import (
    call_llm_stream, 
    is_sse, 
    is_valid_model, 
    ROOT_DIR, 
    States
)
from app.stores.session_store import SessionStore
from app.tools import get_tool_map, get_tools_for_llm
from app.logger import get_logger

log = get_logger(__name__)
store = SessionStore()

class ChatService:
    async def stream_chat(self, req, is_disconnected_func) -> AsyncGenerator[str, None]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        SENTINEL = "__STREAM_DONE__"
        client_disconnected = asyncio.Event()

        async def emit(event: str, data: Any):
            payload = {"event": event, "data": data}
            await queue.put(f"data: {json.dumps(payload, ensure_ascii=False)}\n\n")

        async def heartbeat():
            while True:
                if client_disconnected.is_set():
                    break
                await asyncio.sleep(10)
                await queue.put(": keep-alive\n\n")

        async def runner():
            try:
                states = States()
                chat_id = req.chatId or uuid4().hex
                log.info("chat stream started", extra={"chat_id": chat_id})

                if req.userInfo:
                    states.user_id = req.userInfo.get("id")

                system_prompt = (ROOT_DIR / "prompts" / "system.txt").read_text(encoding="utf-8").format(
                    current_date=datetime.now().strftime("%Y-%m-%d"),
                    locale="ko-KR"
                )

                model = os.getenv("DEFAULT_MODEL")
                llm_regex = re.compile(r"<llm>(.*?)</llm>")
                llm_match = llm_regex.search(req.question)
                if llm_match:
                    log.info("model override detected", extra={"chat_id": chat_id, "model": model})
                    model = llm_match.group(1)
                    if not is_valid_model(model):
                        model = os.getenv("DEFAULT_MODEL")
                        log.warning("model not found", extra={"chat_id": chat_id, "model": model})
                    req.question = llm_regex.sub("", req.question).strip()
                
                # 초기화
                model_set_context = []
                if states.user_id:
                    model_set_context_list = await store.get_messages(states.user_id)
                    if model_set_context_list:
                        model_set_context = [{
                                "role": "system",
                                "content": "### User Memory\n" + "\n".join([f"{idx}. {msc}" for idx, msc in enumerate(model_set_context_list,   start=1)])
                            }]
                
                persisted = (await store.get_messages(chat_id)) or []
                history = [
                    *persisted,
                    {"role": "user", "content": req.question}
                ]
                
                states.messages = [
                    {"role": "system", "content": system_prompt},
                    *model_set_context,
                    *history
                ]
                states.tools = await get_tools_for_llm()
                tool_map = await get_tool_map()

                while True:
                    if client_disconnected.is_set():
                        break
                    async for res in call_llm_stream(
                        messages=states.messages,
                        tools=states.tools,
                        temperature=float(os.getenv("RESEARCH_AGENT_TEMPERATURE", 0.7)),
                        model=model
                    ):
                        if is_sse(res):
                            await emit(res["event"], res["data"])
                        else:
                            states.messages.append(res)

                    tool_calls = res.get("tool_calls")
                    contents = res.get("content")
                    # 툴 호출이 없고 콘텐츠가 있으면 종료
                    if not tool_calls and contents:
                        break
                    # 툴 호출이 없고 콘텐츠가 없으면 다시 인퍼런스 시도
                    elif not tool_calls and not contents:
                        continue
                    # 툴 호출이 있으면 툴 호출 처리
                    for tool_call in tool_calls:
                        tool_name = tool_call['function']['name']
                        tool_args = json.loads(tool_call['function']['arguments'])
                        log.info("tool call", extra={"chat_id": chat_id, "tool_name": tool_name})
                        
                        try:
                            tool_res = tool_map[tool_name](states, **tool_args)

                            # 비동기 처리
                            if asyncio.iscoroutine(tool_res):
                                tool_res = await tool_res

                        except Exception as e:
                            log.exception("tool call failed", extra={"chat_id": chat_id, "tool_name": tool_name})
                            tool_res = f"Error calling {tool_name}: {e}\n\nTry again with different arguments."

                        # MCP 도구 결과를 구조화된 형태로 LLM에 전달
                        if isinstance(tool_res, (dict, list)):
                            tool_content = json.dumps(tool_res, ensure_ascii=False, indent=2)
                        else:
                            tool_content = str(tool_res)
                        states.messages.append({"role": "tool", "content": tool_content, "tool_call_id": tool_call['id']})

                        # 디버깅용 로그: 툴 실행 직후 tool_state.id_to_iframe 상태
                        try:
                            log.info(
                                "tool_state updated after tool call",
                                extra={
                                    "chat_id": chat_id,
                                    "tool_name": tool_name,
                                    "id_to_iframe_keys": list(states.tool_state.id_to_iframe.keys()),
                                    "id_to_iframe_count": len(states.tool_state.id_to_iframe),
                                },
                            )
                        except Exception:
                            pass

                        # 최신 툴 상태를 프론트에 전달하여 차트 등의 리소스를 즉시 렌더링할 수 있게 함
                        await emit("tool_state", states.tool_state.model_dump())

            except Exception as e:
                log.exception("chat stream failed")
                await emit("error", str(e))
                await emit("token", f"\n\n오류가 발생했습니다: {e}")
            finally:
                last_message = states.messages[-1]
                
                if isinstance(last_message, dict) and last_message.get("role") == "assistant":
                    content = last_message.get("content", "")
                    if isinstance(content, str):
                        content = re.sub(r"【[^】]*】", "", content).strip()
                        last_message = {**last_message, "content": content}
                
                history.append(last_message)
                await store.save_messages(chat_id, history)
                await emit("result", None)
                await queue.put(SENTINEL)
                log.info("chat stream finished", extra={"chat_id": chat_id})

        producer = asyncio.create_task(runner())
        pinger = asyncio.create_task(heartbeat())

        try:
            while True:
                if await is_disconnected_func():
                    client_disconnected.set()
                    break
                chunk = await queue.get()
                if chunk == SENTINEL:
                    break
                yield chunk
        finally:
            client_disconnected.set()
            producer.cancel()
            pinger.cancel()

from __future__ import annotations

import os
from typing import List, Dict
import time

try:
    import httpx
except Exception:  # pragma: no cover
    httpx = None


SYS_PROMPT = (
    "You are a professional translator. Translate only the text. "
    "Preserve masks like [[MASK_001]], numbers, units, and punctuation. "
    "Apply glossary terms strictly if provided. "
    "Output ONLY a valid JSON array of objects with keys id and target, in the same order as input. "
    "Do not include explanations and do NOT wrap output in markdown code fences."
)


class OpenRouterClient:
    def __init__(self, api_key: str | None, model: str, mock: bool = False, site_url: str | None = None, site_name: str | None = None) -> None:
        self.api_key = api_key
        self.model = model
        self.mock = mock or (httpx is None) or (not api_key)
        self.site_url = site_url
        self.site_name = site_name

    def translate_batch(self, segments: List[Dict], *, target_locale: str, source_locale: str | None = None, style: Dict | None = None) -> List[Dict]:
        if self.mock:
            out = []
            for s in segments:
                out.append({"id": s["id"], "target": s["source"]})
            return out

        assert httpx is not None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.site_url:
            headers["HTTP-Referer"] = self.site_url
        if self.site_name:
            headers["X-Title"] = self.site_name

        # Build a text user prompt carrying JSON payload
        import json as _json
        user_payload = {
            "segments": segments,
            "constraints": {
                "json_only": True,
                "preserve_masks": True,
                "preserve_numbers": True,
                "target_locale": target_locale,
                "source_locale": source_locale or "auto",
                "style": style or {},
            },
        }
        user_content = _json.dumps(user_payload, ensure_ascii=False)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": _build_system_prompt(target_locale, source_locale)},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0,
            # Avoid JSON mode/response_format for broad model compatibility
        }

        url = "https://openrouter.ai/api/v1/chat/completions"
        with httpx.Client(timeout=120) as client:
            last_err: Exception | None = None
            for attempt in range(3):
                resp = client.post(url, headers=headers, json=payload)
                try:
                    resp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    last_err = httpx.HTTPStatusError(f"{e}. body={resp.text}", request=e.request, response=e.response)
                    time.sleep(1.0 * (attempt + 1))
                    continue
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                try:
                    items = _parse_llm_segments(content, expected=len(segments))
                    return items  # may be fewer than expected; caller can repair
                except Exception as pe:
                    last_err = pe
                    time.sleep(0.8 * (attempt + 1))
                    continue
            assert last_err is not None
            # On repeated parse failure, raise
            raise last_err

    def complete_json(self, system_prompt: str, user_content: str | Dict | List, *, temperature: float = 0.0, max_retries: int = 3) -> object:
        if self.mock:
            raise RuntimeError("OpenRouter client is running in mock mode")
        assert httpx is not None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.site_url:
            headers["HTTP-Referer"] = self.site_url
        if self.site_name:
            headers["X-Title"] = self.site_name
        if isinstance(user_content, (dict, list)):
            import json as _json
            user_payload = _json.dumps(user_content, ensure_ascii=False)
        else:
            user_payload = str(user_content)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_payload},
            ],
            "temperature": temperature,
        }
        url = "https://openrouter.ai/api/v1/chat/completions"
        with httpx.Client(timeout=120) as client:
            last_err: Exception | None = None
            for attempt in range(max_retries):
                resp = client.post(url, headers=headers, json=payload)
                try:
                    resp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    last_err = httpx.HTTPStatusError(f"{e}. body={resp.text}", request=e.request, response=e.response)
                    time.sleep(1.0 * (attempt + 1))
                    continue
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                try:
                    return _safe_json_parse(content)
                except Exception as pe:
                    last_err = pe
                    time.sleep(0.8 * (attempt + 1))
                    continue
            if last_err:
                raise last_err
            raise RuntimeError("OpenRouter 응답을 파싱할 수 없습니다.")


def _safe_json_parse(text: str):
    import json
    s = text.strip()
    if not s:
        raise ValueError("empty content")
    # Strip markdown fences if present
    if s.startswith("```"):
        # find first and last fence
        parts = s.split("```")
        for part in parts:
            part = part.strip()
            if part and not part.startswith("json"):
                try:
                    return json.loads(part)
                except Exception:
                    continue
    # direct parse
    try:
        return json.loads(s)
    except Exception:
        # Try to extract the first JSON array substring
        import re
        m = re.search(r"\[.*\]", s, flags=re.DOTALL)
        if m:
            return json.loads(m.group(0))
        raise


def _parse_llm_segments(content: object, expected: int) -> List[Dict]:
    """Parse LLM output into a list of {id,target}. Tolerant to minor formatting issues."""
    if isinstance(content, list):
        return content  # assume already parsed
    if not isinstance(content, str):
        raise ValueError("Unsupported content type from LLM")
    try:
        parsed = _safe_json_parse(content)
        if isinstance(parsed, dict) and "segments" in parsed:
            arr = parsed["segments"]
        else:
            arr = parsed
        if isinstance(arr, list):
            return arr
    except Exception:
        pass
    # Fallback: scan for JSON objects and parse individually, then rebuild array
    objs: List[Dict] = []
    s = content
    n = len(s)
    i = 0
    while i < n:
        if s[i] == '{':
            start = i
            depth = 0
            j = i
            in_str = False
            esc = False
            while j < n:
                ch = s[j]
                if in_str:
                    if esc:
                        esc = False
                    elif ch == '\\':
                        esc = True
                    elif ch == '"':
                        in_str = False
                else:
                    if ch == '"':
                        in_str = True
                    elif ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            # candidate
                            chunk = s[start:j+1]
                            try:
                                import json
                                obj = json.loads(chunk)
                                if isinstance(obj, dict) and 'id' in obj and 'target' in obj:
                                    objs.append(obj)
                            except Exception:
                                pass
                            i = j
                            break
                j += 1
        i += 1
    if objs:
        return objs
    raise ValueError("Unable to parse LLM output into segments")


def _build_system_prompt(target_locale: str, source_locale: str | None) -> str:
    target = target_locale
    src = source_locale or "auto-detect"
    return (
        f"You are a professional translator. Translate every segment from {src} into {target}. "
        "All outputs MUST be in the target language. Preserve masks like [[MASK_001]], numbers, units, punctuation, and hyperlinks as-is. "
        "Apply glossary strictly if provided. Output ONLY a valid JSON array of objects with keys id and target, in the same order as input. "
        "Do not include any explanations and do NOT wrap output in markdown code fences."
    )

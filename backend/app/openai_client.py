import os
from functools import lru_cache

from openai import AsyncOpenAI


class MissingAPIKeyError(RuntimeError):
    """Raised when an OpenRouter/OpenAI API key is missing."""


@lru_cache()
def get_openai_client() -> AsyncOpenAI:
    """
    Lazily initialize a single AsyncOpenAI client instance.

    The platform only needs a lightweight subset of OpenAI features to summarize
    event data, so we centralize the configuration here instead of carrying the
    previous chat stack.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise MissingAPIKeyError("OPENROUTER_API_KEY is not configured.")

    base_url = os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")
    return AsyncOpenAI(api_key=api_key, base_url=base_url)

import os
from dataclasses import dataclass


def _env(key: str, default: str | None = None) -> str | None:
    return os.getenv(key, default)


def _bool_env(key: str, default: str = "false") -> bool:
    return (_env(key, default) or "false").strip().lower() == "true"


@dataclass
class Settings:
    STORAGE_DIR: str = _env("TRANSLATION_STORAGE_DIR", _env("STORAGE_DIR", "run/storage"))
    QUEUE_DIR: str = _env("TRANSLATION_QUEUE_DIR", _env("QUEUE_DIR", "run/queue"))

    OPENROUTER_API_KEY: str | None = _env("TRANSLATION_OPENROUTER_API_KEY", _env("OPENROUTER_API_KEY"))
    OPENROUTER_MODEL: str = _env(
        "LLM_TRANSLATE",
        _env("TRANSLATION_MODEL", _env("OPENROUTER_MODEL", "deepseek/deepseek-chat")),
    )
    OPENROUTER_SITE_URL: str | None = _env("OPENROUTER_SITE_URL")
    OPENROUTER_SITE_NAME: str | None = _env("OPENROUTER_SITE_NAME")

    MOCK_TRANSLATION: bool = _bool_env("TRANSLATION_MOCK", _env("MOCK_TRANSLATION", "false") or "false")


settings = Settings()

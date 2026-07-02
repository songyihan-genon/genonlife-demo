import re
from typing import List


SENTENCE_END = re.compile(r"(?<=[.!?])\s+|||5", re.MULTILINE)


def split_sentences(text: str) -> List[str]:
    parts = [p.strip() for p in SENTENCE_END.split(text) if p and p.strip()]
    return parts if parts else ([text] if text else [])


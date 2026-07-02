import re
from typing import Tuple, Dict


MASK_PATTERN = "[[MASK_{:03d}]]"


REGEXES = {
    "url": re.compile(r"https?://\S+", re.IGNORECASE),
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "number": re.compile(r"(?<!\w)([+-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?(?:%|[kKmMbB])?)(?!\w)"),
}


def apply_masks(text: str) -> Tuple[str, Dict[str, str]]:
    mask_map: Dict[str, str] = {}
    i = 1
    def _repl(m: re.Match) -> str:
        nonlocal i, mask_map
        token = MASK_PATTERN.format(i)
        mask_map[token] = m.group(0)
        i += 1
        return token

    # Apply sequentially; avoid overlapping by replacing progressively
    masked = text
    for rx in REGEXES.values():
        masked = rx.sub(_repl, masked)
    return masked, mask_map


def revert_masks(text: str, mask_map: Dict[str, str]) -> str:
    out = text
    for token, original in mask_map.items():
        out = out.replace(token, original)
    return out


from enum import Enum
from typing import Literal


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    POSTPROCESS = "POSTPROCESS"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


LocaleCode = str
Tone = Literal["formal", "casual", "neutral"]
Terseness = Literal["concise", "normal", "verbose"]

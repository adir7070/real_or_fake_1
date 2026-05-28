from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class FrameResult(BaseModel):
    frame_index: int
    timestamp_s: float
    label: str
    confidence: float
    probabilities: dict[str, float]


class VideoPredictionResult(BaseModel):
    label: str
    confidence: float
    probabilities: dict[str, float]
    frames_analyzed: int
    duration_s: float
    frame_results: list[FrameResult]
    model_arch: str
    inference_ms: float
    timestamp: datetime

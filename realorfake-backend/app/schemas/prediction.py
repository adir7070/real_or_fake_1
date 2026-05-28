from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import Literal
from datetime import datetime

Label = Literal["real", "ai_generated"]


class PredictionRequestURL(BaseModel):
    """Request body for POST /api/predict/url"""

    url: HttpUrl
    include_heatmap: bool = True


class PredictionResult(BaseModel):
    """Single-image prediction outcome."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "label": "ai_generated",
                "confidence": 0.973,
                "probabilities": {"real": 0.027, "ai_generated": 0.973},
                "heatmap_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
                "model_arch": "vit_b_16",
                "inference_ms": 312,
                "input_size": 224,
                "timestamp": "2026-05-15T10:21:00Z",
            }
        }
    )

    label: Label
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: dict[Label, float]
    heatmap_base64: str | None = None
    heatmap_raw_base64: str | None = None
    model_arch: str
    inference_ms: int
    input_size: int
    timestamp: datetime

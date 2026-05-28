from pydantic import BaseModel, Field
from app.schemas.prediction import PredictionResult


class BatchItemError(BaseModel):
    index: int
    filename: str | None
    error: str
    code: str


class BatchPredictionResponse(BaseModel):
    results: list[PredictionResult]
    errors: list[BatchItemError]
    total: int = Field(ge=0)
    successful: int = Field(ge=0)
    failed: int = Field(ge=0)
    total_inference_ms: int

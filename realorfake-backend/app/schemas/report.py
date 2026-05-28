from pydantic import BaseModel, Field
from app.schemas.prediction import PredictionResult


class ReportRequest(BaseModel):
    prediction: PredictionResult
    original_image_base64: str
    filename: str | None = None
    notes: str | None = Field(default=None, max_length=2000)
    locale: str = "he"

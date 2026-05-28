from fastapi import APIRouter, Depends

from app.api.deps import get_prediction_service
from app.schemas.model_info import ModelInfo
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/info", response_model=ModelInfo)
async def model_info(
    service: PredictionService = Depends(get_prediction_service),
) -> ModelInfo:
    return service.get_model_info()

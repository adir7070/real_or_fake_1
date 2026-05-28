from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.schemas.prediction import PredictionResult, PredictionRequestURL
from app.services.prediction_service import PredictionService
from app.services.url_fetch_service import URLFetchService
from app.api.deps import get_prediction_service, get_url_fetch_service

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("", response_model=PredictionResult)
async def predict(
    file: UploadFile = File(...),
    include_heatmap: bool = Form(True),
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResult:
    contents = await file.read()
    return await service.predict_bytes(
        contents=contents,
        filename=file.filename,
        content_type=file.content_type,
        include_heatmap=include_heatmap,
    )


@router.post("/url", response_model=PredictionResult)
async def predict_from_url(
    payload: PredictionRequestURL,
    fetcher: URLFetchService = Depends(get_url_fetch_service),
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResult:
    bytes_, content_type = await fetcher.fetch(str(payload.url))
    return await service.predict_bytes(
        contents=bytes_,
        filename=str(payload.url).split("/")[-1],
        content_type=content_type,
        include_heatmap=payload.include_heatmap,
    )

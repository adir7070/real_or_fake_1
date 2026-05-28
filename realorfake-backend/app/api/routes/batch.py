from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import get_prediction_service
from app.schemas.batch import BatchItemError, BatchPredictionResponse
from app.schemas.prediction import PredictionResult
from app.services.prediction_service import PredictionService
import time

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    files: List[UploadFile] = File(...),
    include_heatmap: bool = Form(False),
    service: PredictionService = Depends(get_prediction_service),
) -> BatchPredictionResponse:
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files per batch request")

    results: list[PredictionResult] = []
    errors: list[BatchItemError] = []
    t0 = time.perf_counter()

    for i, f in enumerate(files):
        try:
            content = await f.read()
            r = await service.predict_bytes(
                contents=content,
                filename=f.filename,
                content_type=f.content_type,
                include_heatmap=include_heatmap,
            )
            results.append(r)
        except Exception as e:
            errors.append(
                BatchItemError(
                    index=i,
                    filename=f.filename,
                    error=str(e),
                    code=getattr(e, "code", "UNKNOWN"),
                )
            )

    total_ms = int((time.perf_counter() - t0) * 1000)
    return BatchPredictionResponse(
        results=results,
        errors=errors,
        total=len(files),
        successful=len(results),
        failed=len(errors),
        total_inference_ms=total_ms,
    )

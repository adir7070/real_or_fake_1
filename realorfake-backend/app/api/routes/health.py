from fastapi import APIRouter, Depends
from app.api.deps import get_inference_engine, get_uptime
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(
    engine=Depends(get_inference_engine), uptime: float = Depends(get_uptime)
):
    return {
        "status": "ok",
        "model_loaded": engine.is_loaded,
        "version": settings.app_version,
        "uptime_s": int(uptime),
    }

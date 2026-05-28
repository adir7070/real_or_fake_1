import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.errors import AppError, ModelNotLoadedError, app_error_handler
from app.api.routes import batch, health, model_info, predict, report, video
from app.config import settings
from app.ml.inference import InferenceEngine
from app.services.prediction_service import PredictionService
from app.services.report_service import ReportService
from app.services.url_fetch_service import URLFetchService
from app.utils.logging import setup_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    app.state.start_time = time.perf_counter()

    engine = InferenceEngine(
        checkpoint_path=settings.model_path,
        arch=settings.model_arch,
        device_pref=settings.model_device,
        input_size=settings.model_input_size,
    )
    try:
        engine.load()
        logger.info("Model loaded: arch=%s device=%s", engine.arch, engine.device)
    except ModelNotLoadedError as e:
        logger.warning("Startup without model checkpoint: %s", e)

    app.state.inference_engine = engine
    app.state.prediction_service = PredictionService(engine)
    app.state.url_fetch_service = URLFetchService(
        timeout_s=settings.url_fetch_timeout_s,
        max_mb=settings.url_fetch_max_mb,
        user_agent=settings.url_fetch_user_agent,
    )
    app.state.report_service = ReportService(public_app_url=settings.public_app_url)

    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="RealOrFake API",
        version=settings.app_version,
        description="Detects AI-generated images.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]

    app.include_router(health.router)
    app.include_router(predict.router, prefix="/api")
    app.include_router(batch.router, prefix="/api")
    app.include_router(report.router, prefix="/api")
    app.include_router(model_info.router, prefix="/api")
    app.include_router(video.router, prefix="/api")

    return app


app = create_app()

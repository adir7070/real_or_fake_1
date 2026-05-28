from fastapi import Request
from app.ml.inference import InferenceEngine
from app.services.prediction_service import PredictionService
from app.services.url_fetch_service import URLFetchService
from app.services.report_service import ReportService
import time


def get_inference_engine(request: Request) -> InferenceEngine:
    return request.app.state.inference_engine


def get_prediction_service(request: Request) -> PredictionService:
    return request.app.state.prediction_service


def get_url_fetch_service(request: Request) -> URLFetchService:
    return request.app.state.url_fetch_service


def get_report_service(request: Request) -> ReportService:
    return request.app.state.report_service


def get_uptime(request: Request) -> float:
    return time.perf_counter() - request.app.state.start_time

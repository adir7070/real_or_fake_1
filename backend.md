# RealOrFake — Backend Specification

> **Document type:** Implementation spec for Claude Code
> **Target:** Complete FastAPI + PyTorch backend for an AI-generated image detector
> **Reader:** Assume an autonomous coding agent that will produce a full working project from this document.

---

## 1. Mission & scope

RealOrFake is an academic project (final project for a multimedia & ML course). The backend has two responsibilities:

1. **Training pipeline** — reproducible training/evaluation of binary classifiers (Real vs AI-generated images) using Transfer Learning. Runs in Colab/locally, produces model checkpoints. **This is offline; it does not run on the API server.**
2. **Inference API** — a FastAPI service that loads a trained checkpoint and exposes endpoints the Next.js frontend calls. The service classifies uploaded images and returns a label, confidence, and a Grad-CAM heatmap.

The split is intentional: the API server stays small and fast; heavy training stays out of the deployment.

### Course requirements this backend satisfies

| Course requirement | Where it is addressed |
|---|---|
| Use of a neural network / Transfer Learning | `app/ml/models/` — EfficientNet-B0, ViT-B/16, baseline CNN |
| Real data | CIFAKE (120k images), GenImage, custom set |
| Training process | `training/scripts/train.py` + Colab notebooks |
| Model used inside the app | `app/services/prediction_service.py` |
| Evaluation metrics: accuracy, confusion matrix, precision/recall | `training/scripts/evaluate.py`, exposed via `/api/model/info` |
| Library: PyTorch / torchvision | core stack |
| Library: OpenCV | image preprocessing in `app/services/image_service.py` |
| App library (Streamlit/Gradio/tkinter) | **Deviation** — FastAPI + Next.js used instead. Justify in report as: separation of concerns, deployability, modern architecture. |
| User interaction (file upload, etc.) | `POST /api/predict` accepts file or URL |

---

## 2. Tech stack (exact versions)

```
Python                3.11.x
fastapi               0.115.x
uvicorn[standard]     0.32.x
pydantic              2.9.x
pydantic-settings     2.6.x
python-multipart      0.0.12
httpx                 0.27.x

torch                 2.4.x
torchvision           0.19.x
pytorch-grad-cam      1.5.x

opencv-python-headless 4.10.x
Pillow                10.4.x
numpy                 1.26.x
pandas                2.2.x
scikit-learn          1.5.x
matplotlib            3.9.x
seaborn               0.13.x

reportlab             4.2.x          # PDF reports
qrcode                7.4.x          # QR for poster
PyYAML                6.0.x          # training configs

pytest                8.3.x
pytest-asyncio        0.24.x
pytest-cov            5.0.x
ruff                  0.7.x
mypy                  1.13.x
```

**Note on torch wheels:** Use the CPU wheel index for deployment (Render free tier has no GPU). The training environment (Colab) uses default CUDA wheels.

---

## 3. Project structure

```
realorfake-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI app factory
│   ├── config.py                     # Pydantic Settings
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                   # Dependency-injection helpers
│   │   ├── errors.py                 # Exception classes + handlers
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py
│   │       ├── predict.py
│   │       ├── batch.py
│   │       ├── report.py
│   │       └── model_info.py
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── baseline_cnn.py
│   │   │   ├── efficientnet.py
│   │   │   ├── vit.py
│   │   │   └── factory.py
│   │   ├── dataset.py                # PyTorch Dataset for CIFAKE
│   │   ├── transforms.py             # Pre-/post-processing
│   │   ├── augmentations.py          # JPEG comp, flips, etc.
│   │   ├── inference.py              # InferenceEngine class
│   │   ├── gradcam.py                # GradCAMService
│   │   └── checkpoint.py             # Load/save utilities
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── prediction.py
│   │   ├── batch.py
│   │   ├── report.py
│   │   └── model_info.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── prediction_service.py
│   │   ├── image_service.py
│   │   ├── url_fetch_service.py
│   │   └── report_service.py
│   └── utils/
│       ├── __init__.py
│       ├── logging.py
│       ├── image_io.py
│       └── timing.py
├── training/
│   ├── notebooks/
│   │   ├── 01_eda.ipynb
│   │   ├── 02_baseline_cnn.ipynb
│   │   ├── 03_transfer_learning.ipynb
│   │   └── 04_evaluation.ipynb
│   ├── scripts/
│   │   ├── prepare_data.py
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── cross_generator_test.py
│   ├── configs/
│   │   ├── baseline.yaml
│   │   ├── efficientnet.yaml
│   │   └── vit.yaml
│   └── README.md
├── models/
│   ├── .gitkeep
│   └── (best_model.pth lives here at runtime)
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── fixtures/
│   │   ├── real_sample.jpg
│   │   └── fake_sample.jpg
│   ├── test_api_health.py
│   ├── test_api_predict.py
│   ├── test_inference.py
│   ├── test_image_service.py
│   └── test_schemas.py
├── .env.example
├── .gitignore
├── .python-version                   # 3.11
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml                # for local dev
├── render.yaml
└── README.md
```

---

## 4. Configuration

### `.env.example`

```bash
# App
APP_ENV=development                  # development | production
APP_NAME=realorfake-backend
APP_VERSION=0.1.0
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8000

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,https://realorfake.vercel.app

# Model
MODEL_PATH=models/best_model.pth
MODEL_ARCH=vit_b_16                  # baseline_cnn | efficientnet_b0 | vit_b_16
MODEL_DEVICE=auto                    # auto | cpu | cuda
MODEL_INPUT_SIZE=224

# Inference limits
MAX_UPLOAD_MB=10
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
REQUEST_TIMEOUT_S=30

# URL fetch (POST /predict/url)
URL_FETCH_TIMEOUT_S=10
URL_FETCH_MAX_MB=10
URL_FETCH_USER_AGENT=RealOrFake/0.1

# Report
REPORT_OUTPUT_DIR=/tmp/realorfake-reports

# Frontend public URL (for embedding in PDF reports)
PUBLIC_APP_URL=https://realorfake.vercel.app
```

### `app/config.py`

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_env: Literal["development", "production"] = "development"
    app_name: str = "realorfake-backend"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Model
    model_path: str = "models/best_model.pth"
    model_arch: Literal["baseline_cnn", "efficientnet_b0", "vit_b_16"] = "vit_b_16"
    model_device: Literal["auto", "cpu", "cuda"] = "auto"
    model_input_size: int = 224

    # Limits
    max_upload_mb: int = 10
    allowed_mime_types: str = "image/jpeg,image/png,image/webp"
    request_timeout_s: int = 30

    # URL fetch
    url_fetch_timeout_s: int = 10
    url_fetch_max_mb: int = 10
    url_fetch_user_agent: str = "RealOrFake/0.1"

    # Report
    report_output_dir: str = "/tmp/realorfake-reports"

    # Public URL
    public_app_url: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_mime_types_set(self) -> set[str]:
        return {m.strip() for m in self.allowed_mime_types.split(",") if m.strip()}

settings = Settings()
```

---

## 5. Schemas (Pydantic v2)

All API request/response models live in `app/schemas/`. Backend uses these for validation; frontend mirrors them as TypeScript types (see `frontend.md`).

### `app/schemas/common.py`

```python
from pydantic import BaseModel
from typing import Generic, TypeVar
from datetime import datetime

T = TypeVar("T")

class Timestamped(BaseModel):
    timestamp: datetime

class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    code: str
```

### `app/schemas/prediction.py`

```python
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
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "label": "ai_generated",
            "confidence": 0.973,
            "probabilities": {"real": 0.027, "ai_generated": 0.973},
            "heatmap_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
            "model_arch": "vit_b_16",
            "inference_ms": 312,
            "input_size": 224,
            "timestamp": "2026-05-15T10:21:00Z"
        }
    })
    label: Label
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: dict[Label, float]
    heatmap_base64: str | None = None         # PNG, base64, with overlay applied
    heatmap_raw_base64: str | None = None     # PNG of pure Grad-CAM (no overlay)
    model_arch: str
    inference_ms: int
    input_size: int
    timestamp: datetime
```

### `app/schemas/batch.py`

```python
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
```

### `app/schemas/report.py`

```python
from pydantic import BaseModel, Field
from app.schemas.prediction import PredictionResult

class ReportRequest(BaseModel):
    prediction: PredictionResult
    original_image_base64: str            # the user's source image, for inclusion in PDF
    filename: str | None = None
    notes: str | None = Field(default=None, max_length=2000)
    locale: str = "he"                    # "he" | "en"
```

### `app/schemas/model_info.py`

```python
from pydantic import BaseModel
from datetime import datetime

class ConfusionMatrix(BaseModel):
    """Raw counts: [[TN, FP], [FN, TP]] where positive class = ai_generated."""
    tn: int
    fp: int
    fn: int
    tp: int

class ClassMetrics(BaseModel):
    precision: float
    recall: float
    f1: float
    support: int

class TrainingMetrics(BaseModel):
    accuracy: float
    auc: float
    confusion_matrix: ConfusionMatrix
    per_class: dict[str, ClassMetrics]   # keys: "real", "ai_generated"

class CrossGeneratorResult(BaseModel):
    """Evaluation on a generator NOT seen during training."""
    generator_name: str                  # "dalle3", "midjourney_v6", "felora_mix"
    accuracy: float
    auc: float
    n_samples: int

class ModelInfo(BaseModel):
    arch: str
    input_size: int
    parameters_total: int
    parameters_trainable: int
    device: str
    checkpoint_loaded_at: datetime
    training_metrics: TrainingMetrics | None = None
    cross_generator_results: list[CrossGeneratorResult] = []
    jpeg_robustness: dict[str, float] = {}   # {"Q90": 0.92, "Q70": 0.88, ...}
```

---

## 6. API endpoints

Base URL prefix: `/api` for everything except `/health`.

### Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Liveness probe |
| GET  | `/api/model/info` | Static info + training metrics for the currently loaded model |
| POST | `/api/predict` | Predict on uploaded image (multipart) |
| POST | `/api/predict/url` | Predict on an image fetched from a URL |
| POST | `/api/predict/batch` | Predict on multiple uploaded images |
| POST | `/api/report` | Generate a PDF report for a prediction |

### `GET /health`

Returns liveness + readiness (whether model is loaded).

```python
# Response 200
{ "status": "ok", "model_loaded": true, "version": "0.1.0", "uptime_s": 1234 }
```

### `GET /api/model/info`

Returns the `ModelInfo` schema above. Training metrics are loaded from a JSON file alongside the checkpoint (`models/best_model.metrics.json`).

### `POST /api/predict`

- **Content-Type:** `multipart/form-data`
- **Form fields:**
  - `file` (required, UploadFile): image
  - `include_heatmap` (optional, bool, default `true`)
- **Validations** (return 400 + `ErrorResponse` on failure):
  - File size ≤ `MAX_UPLOAD_MB`
  - MIME type ∈ `ALLOWED_MIME_TYPES`
  - Decodable as image (Pillow `Image.open` + `verify()`)
- **Response:** `PredictionResult`
- **Errors:**
  - 400 `INVALID_FILE` — bad MIME or unreadable
  - 413 `FILE_TOO_LARGE`
  - 500 `INFERENCE_FAILED`

### `POST /api/predict/url`

- **Content-Type:** `application/json`
- **Body:** `PredictionRequestURL`
- Server fetches the URL with `httpx`, enforces size limits, then runs prediction.
- **Errors additionally:**
  - 400 `URL_INVALID`
  - 408 `URL_TIMEOUT`
  - 415 `URL_BAD_CONTENT_TYPE`

### `POST /api/predict/batch`

- **Content-Type:** `multipart/form-data`
- **Form fields:**
  - `files` (List[UploadFile], required, max 10)
  - `include_heatmap` (bool, default `false` for batch — heatmaps inflate response)
- Runs sequentially (no batched tensor inference for v1; can optimize later).
- One bad file does not fail the whole batch — failures appear in `errors[]`.
- **Response:** `BatchPredictionResponse`

### `POST /api/report`

- **Content-Type:** `application/json`
- **Body:** `ReportRequest`
- Returns a PDF (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="realorfake-report.pdf"`).
- PDF includes: original image, label, confidence, heatmap (if present in request), notes, timestamp, model info, QR code linking to `PUBLIC_APP_URL`.

---

## 7. Routes implementation

Use `APIRouter` per file; mount all under the `/api` prefix in `main.py`, except `/health` which is mounted at root.

### `app/api/routes/health.py`

```python
from fastapi import APIRouter, Depends
from app.api.deps import get_inference_engine, get_uptime
from app.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
async def health(engine=Depends(get_inference_engine), uptime: float = Depends(get_uptime)):
    return {
        "status": "ok",
        "model_loaded": engine.is_loaded,
        "version": settings.app_version,
        "uptime_s": int(uptime),
    }
```

### `app/api/routes/predict.py`

```python
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from app.schemas.prediction import PredictionResult, PredictionRequestURL
from app.services.prediction_service import PredictionService
from app.services.url_fetch_service import URLFetchService
from app.api.deps import get_prediction_service, get_url_fetch_service
from app.api.errors import (
    InvalidFileError, FileTooLargeError, InferenceError, URLFetchError,
)

router = APIRouter(prefix="/predict", tags=["predict"])

@router.post("", response_model=PredictionResult)
async def predict(
    file: UploadFile = File(...),
    include_heatmap: bool = Form(True),
    service: PredictionService = Depends(get_prediction_service),
):
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
):
    bytes_, content_type = await fetcher.fetch(str(payload.url))
    return await service.predict_bytes(
        contents=bytes_,
        filename=str(payload.url).split("/")[-1],
        content_type=content_type,
        include_heatmap=payload.include_heatmap,
    )
```

### `app/api/routes/batch.py`

```python
from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.schemas.batch import BatchPredictionResponse, BatchItemError
from app.schemas.prediction import PredictionResult
from app.services.prediction_service import PredictionService
from app.api.deps import get_prediction_service
import time

router = APIRouter(prefix="/predict", tags=["predict"])

@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    files: list[UploadFile] = File(..., max_length=10),
    include_heatmap: bool = Form(False),
    service: PredictionService = Depends(get_prediction_service),
):
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
            errors.append(BatchItemError(
                index=i, filename=f.filename, error=str(e), code=getattr(e, "code", "UNKNOWN")
            ))

    total_ms = int((time.perf_counter() - t0) * 1000)
    return BatchPredictionResponse(
        results=results, errors=errors,
        total=len(files), successful=len(results), failed=len(errors),
        total_inference_ms=total_ms,
    )
```

### `app/api/routes/report.py`

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.schemas.report import ReportRequest
from app.services.report_service import ReportService
from app.api.deps import get_report_service

router = APIRouter(prefix="/report", tags=["report"])

@router.post("")
async def generate_report(
    payload: ReportRequest,
    service: ReportService = Depends(get_report_service),
):
    pdf_bytes = service.build_pdf(payload)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="realorfake-report.pdf"'},
    )
```

### `app/api/routes/model_info.py`

```python
from fastapi import APIRouter, Depends
from app.schemas.model_info import ModelInfo
from app.services.prediction_service import PredictionService
from app.api.deps import get_prediction_service

router = APIRouter(prefix="/model", tags=["model"])

@router.get("/info", response_model=ModelInfo)
async def model_info(service: PredictionService = Depends(get_prediction_service)):
    return service.get_model_info()
```

---

## 8. Errors

### `app/api/errors.py`

```python
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from app.schemas.common import ErrorResponse

class AppError(Exception):
    code: str = "APP_ERROR"
    status_code: int = 500
    detail: str | None = None
    def __init__(self, message: str, detail: str | None = None):
        super().__init__(message)
        self.message = message
        self.detail = detail

class InvalidFileError(AppError):
    code = "INVALID_FILE"; status_code = 400

class FileTooLargeError(AppError):
    code = "FILE_TOO_LARGE"; status_code = 413

class URLFetchError(AppError):
    code = "URL_FETCH_FAILED"; status_code = 400

class InferenceError(AppError):
    code = "INFERENCE_FAILED"; status_code = 500

class ModelNotLoadedError(AppError):
    code = "MODEL_NOT_LOADED"; status_code = 503


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error=exc.message, detail=exc.detail, code=exc.code).model_dump(),
    )
```

Register handler in `main.py` with `app.add_exception_handler(AppError, app_error_handler)`.

---

## 9. Dependency-injection helpers

### `app/api/deps.py`

```python
from fastapi import Request
from app.ml.inference import InferenceEngine
from app.services.prediction_service import PredictionService
from app.services.url_fetch_service import URLFetchService
from app.services.report_service import ReportService
import time

# These are populated at app startup (lifespan) and stashed on app.state.
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
```

---

## 10. Application bootstrap

### `app/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from app.config import settings
from app.api.errors import AppError, app_error_handler
from app.api.routes import health, predict, batch, report, model_info
from app.ml.inference import InferenceEngine
from app.services.prediction_service import PredictionService
from app.services.url_fetch_service import URLFetchService
from app.services.report_service import ReportService
from app.utils.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    app.state.start_time = time.perf_counter()

    # Heavy init at startup so first request is fast
    engine = InferenceEngine(
        checkpoint_path=settings.model_path,
        arch=settings.model_arch,
        device_pref=settings.model_device,
        input_size=settings.model_input_size,
    )
    engine.load()
    app.state.inference_engine = engine
    app.state.prediction_service = PredictionService(engine)
    app.state.url_fetch_service = URLFetchService(
        timeout_s=settings.url_fetch_timeout_s,
        max_mb=settings.url_fetch_max_mb,
        user_agent=settings.url_fetch_user_agent,
    )
    app.state.report_service = ReportService(public_app_url=settings.public_app_url)

    yield
    # No teardown needed beyond GC


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

    app.add_exception_handler(AppError, app_error_handler)

    app.include_router(health.router)
    app.include_router(predict.router, prefix="/api")
    app.include_router(batch.router, prefix="/api")
    app.include_router(report.router, prefix="/api")
    app.include_router(model_info.router, prefix="/api")

    return app


app = create_app()
```

---

## 11. ML — Models

### `app/ml/models/baseline_cnn.py`

A small CNN trained from scratch — included for comparison in the report.

```python
import torch.nn as nn

class BaselineCNN(nn.Module):
    """3 conv blocks + FC. Trained from scratch as a contrast to Transfer Learning."""
    def __init__(self, num_classes: int = 2, input_size: int = 224):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True), nn.MaxPool2d(2),
        )
        feat_size = input_size // 8
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
            nn.Linear(128, 64), nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        return self.classifier(x)

    @property
    def gradcam_target_layers(self):
        return [self.features[-2]]   # last Conv2d
```

### `app/ml/models/efficientnet.py`

```python
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

class EfficientNetClassifier(nn.Module):
    def __init__(self, num_classes: int = 2, freeze_backbone: bool = True):
        super().__init__()
        self.backbone = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        if freeze_backbone:
            for p in self.backbone.parameters():
                p.requires_grad = False
            # Unfreeze last block for fine-tuning
            for p in self.backbone.features[-2:].parameters():
                p.requires_grad = True

        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 256), nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    @property
    def gradcam_target_layers(self):
        return [self.backbone.features[-1]]
```

### `app/ml/models/vit.py`

```python
import torch.nn as nn
from torchvision.models import vit_b_16, ViT_B_16_Weights

class ViTClassifier(nn.Module):
    def __init__(self, num_classes: int = 2, freeze_backbone: bool = True):
        super().__init__()
        self.backbone = vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)
        if freeze_backbone:
            for p in self.backbone.parameters():
                p.requires_grad = False
            # Unfreeze last 2 transformer blocks
            for p in self.backbone.encoder.layers[-2:].parameters():
                p.requires_grad = True

        in_features = self.backbone.heads.head.in_features
        self.backbone.heads = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 256), nn.ReLU(inplace=True), nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    @property
    def gradcam_target_layers(self):
        # For ViT, use the LayerNorm before the final encoder block
        return [self.backbone.encoder.layers[-1].ln_1]

    @staticmethod
    def vit_reshape_transform(tensor, height: int = 14, width: int = 14):
        # ViT outputs [batch, tokens, dim]; CAM library expects 4D maps.
        # Drop the CLS token, reshape to [batch, dim, h, w].
        result = tensor[:, 1:, :].reshape(tensor.size(0), height, width, tensor.size(2))
        return result.permute(0, 3, 1, 2)
```

### `app/ml/models/factory.py`

```python
from typing import Literal
import torch.nn as nn
from .baseline_cnn import BaselineCNN
from .efficientnet import EfficientNetClassifier
from .vit import ViTClassifier

Arch = Literal["baseline_cnn", "efficientnet_b0", "vit_b_16"]

def build_model(arch: Arch, num_classes: int = 2, freeze_backbone: bool = True) -> nn.Module:
    if arch == "baseline_cnn":
        return BaselineCNN(num_classes=num_classes)
    if arch == "efficientnet_b0":
        return EfficientNetClassifier(num_classes=num_classes, freeze_backbone=freeze_backbone)
    if arch == "vit_b_16":
        return ViTClassifier(num_classes=num_classes, freeze_backbone=freeze_backbone)
    raise ValueError(f"Unknown arch: {arch}")
```

---

## 12. ML — Data

### `app/ml/dataset.py`

```python
from pathlib import Path
from torch.utils.data import Dataset
from PIL import Image
from typing import Callable

CLASS_TO_IDX = {"real": 0, "ai_generated": 1}

class CIFAKEDataset(Dataset):
    """
    Expected directory layout (after `prepare_data.py` normalizes CIFAKE):
        data_root/
          train/real/*.jpg
          train/ai_generated/*.jpg
          val/real/*.jpg
          val/ai_generated/*.jpg
          test/real/*.jpg
          test/ai_generated/*.jpg
    """
    def __init__(self, data_root: str | Path, split: str, transform: Callable | None = None):
        self.root = Path(data_root) / split
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []
        for cls_name, cls_idx in CLASS_TO_IDX.items():
            cls_dir = self.root / cls_name
            if not cls_dir.exists():
                continue
            for p in cls_dir.rglob("*"):
                if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    self.samples.append((p, cls_idx))
        if not self.samples:
            raise RuntimeError(f"No images found under {self.root}")

    def __len__(self): return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform: img = self.transform(img)
        return img, label
```

### `app/ml/transforms.py`

```python
import torchvision.transforms as T

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

def build_train_transform(input_size: int = 224):
    return T.Compose([
        T.Resize(int(input_size * 1.15)),
        T.RandomResizedCrop(input_size, scale=(0.8, 1.0)),
        T.RandomHorizontalFlip(p=0.5),
        T.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        JPEGCompressionAugmentation(probabilities=(0.0, 0.4, 0.6), qualities=(95, 70, 40)),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

def build_eval_transform(input_size: int = 224):
    return T.Compose([
        T.Resize(int(input_size * 1.15)),
        T.CenterCrop(input_size),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
```

### `app/ml/augmentations.py`

```python
import io
import random
from PIL import Image

class JPEGCompressionAugmentation:
    """
    Randomly re-encode the PIL image as JPEG at varying qualities.
    Crucial for robustness to social-network compression.

    probabilities: distribution over qualities (must sum to 1)
    qualities: matching JPEG qualities (1..95)
    """
    def __init__(self, probabilities=(0.0, 0.4, 0.6), qualities=(95, 70, 40)):
        assert len(probabilities) == len(qualities)
        assert abs(sum(probabilities) - 1.0) < 1e-6
        self.probabilities = probabilities
        self.qualities = qualities

    def __call__(self, img: Image.Image) -> Image.Image:
        q = random.choices(self.qualities, weights=self.probabilities, k=1)[0]
        if q >= 95:
            return img
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=int(q))
        buf.seek(0)
        return Image.open(buf).convert("RGB")
```

---

## 13. ML — Inference engine

### `app/ml/inference.py`

```python
from pathlib import Path
import torch
import torch.nn.functional as F
from PIL import Image
from datetime import datetime, timezone
import time

from app.ml.models.factory import build_model, Arch
from app.ml.transforms import build_eval_transform
from app.ml.gradcam import GradCAMService
from app.api.errors import ModelNotLoadedError, InferenceError

CLASS_NAMES = ["real", "ai_generated"]


class InferenceEngine:
    def __init__(self, checkpoint_path: str, arch: Arch, device_pref: str, input_size: int):
        self.checkpoint_path = Path(checkpoint_path)
        self.arch = arch
        self.input_size = input_size
        self.device = self._resolve_device(device_pref)
        self.model: torch.nn.Module | None = None
        self.transform = build_eval_transform(input_size)
        self.gradcam: GradCAMService | None = None
        self.loaded_at: datetime | None = None

    @staticmethod
    def _resolve_device(pref: str) -> torch.device:
        if pref == "cpu": return torch.device("cpu")
        if pref == "cuda": return torch.device("cuda")
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def load(self):
        if not self.checkpoint_path.exists():
            raise ModelNotLoadedError(f"Checkpoint not found: {self.checkpoint_path}")
        model = build_model(self.arch, num_classes=2, freeze_backbone=False)
        state = torch.load(self.checkpoint_path, map_location=self.device)
        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        model.load_state_dict(state)
        model.to(self.device).eval()
        self.model = model
        self.gradcam = GradCAMService(model=model, arch=self.arch, device=self.device)
        self.loaded_at = datetime.now(timezone.utc)

    @torch.no_grad()
    def predict(self, img: Image.Image, include_heatmap: bool = True):
        if not self.is_loaded:
            raise ModelNotLoadedError("Model not loaded")
        try:
            t0 = time.perf_counter()
            x = self.transform(img).unsqueeze(0).to(self.device)
            logits = self.model(x)
            probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()
            pred_idx = int(probs.argmax())
            inference_ms = int((time.perf_counter() - t0) * 1000)

            heatmap_b64 = None
            heatmap_raw_b64 = None
            if include_heatmap and self.gradcam is not None:
                heatmap_b64, heatmap_raw_b64 = self.gradcam.compute(img, target_class=pred_idx)

            return {
                "label": CLASS_NAMES[pred_idx],
                "confidence": float(probs[pred_idx]),
                "probabilities": {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))},
                "heatmap_base64": heatmap_b64,
                "heatmap_raw_base64": heatmap_raw_b64,
                "inference_ms": inference_ms,
            }
        except Exception as e:
            raise InferenceError("Inference failed", detail=str(e))
```

---

## 14. ML — Grad-CAM

### `app/ml/gradcam.py`

```python
import base64
import io
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
import cv2

from app.ml.transforms import build_eval_transform, IMAGENET_MEAN, IMAGENET_STD


class GradCAMService:
    def __init__(self, model: torch.nn.Module, arch: str, device: torch.device, input_size: int = 224):
        self.model = model
        self.device = device
        self.input_size = input_size
        self.transform = build_eval_transform(input_size)

        target_layers = model.gradcam_target_layers
        reshape = None
        if arch == "vit_b_16":
            from app.ml.models.vit import ViTClassifier
            reshape = ViTClassifier.vit_reshape_transform

        self.cam = GradCAM(model=model, target_layers=target_layers, reshape_transform=reshape)

    def compute(self, img: Image.Image, target_class: int) -> tuple[str, str]:
        """Returns (overlay_png_base64, raw_heatmap_png_base64)."""
        rgb_for_overlay = self._resize_for_overlay(img)            # HxWx3, float [0,1]
        input_tensor = self.transform(img).unsqueeze(0).to(self.device)

        grayscale_cam = self.cam(input_tensor=input_tensor,
                                 targets=[ClassifierOutputTarget(target_class)])[0]  # HxW, float [0,1]

        overlay = show_cam_on_image(rgb_for_overlay, grayscale_cam, use_rgb=True)    # HxWx3 uint8
        raw_heatmap = (cv2.applyColorMap((grayscale_cam * 255).astype(np.uint8), cv2.COLORMAP_JET))
        raw_heatmap = cv2.cvtColor(raw_heatmap, cv2.COLOR_BGR2RGB)

        return self._encode_png(overlay), self._encode_png(raw_heatmap)

    def _resize_for_overlay(self, img: Image.Image) -> np.ndarray:
        from torchvision.transforms.functional import resize, center_crop
        sized = resize(img, int(self.input_size * 1.15))
        cropped = center_crop(sized, self.input_size)
        arr = np.asarray(cropped.convert("RGB"), dtype=np.float32) / 255.0
        return arr

    @staticmethod
    def _encode_png(arr_uint8: np.ndarray) -> str:
        img = Image.fromarray(arr_uint8)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii")
```

---

## 15. Services

### `app/services/image_service.py`

```python
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from app.api.errors import InvalidFileError, FileTooLargeError
from app.config import settings


class ImageService:
    @staticmethod
    def validate_and_open(contents: bytes, content_type: str | None) -> Image.Image:
        if content_type and content_type not in settings.allowed_mime_types_set:
            raise InvalidFileError(
                f"Unsupported MIME type: {content_type}",
                detail=f"Allowed: {sorted(settings.allowed_mime_types_set)}",
            )
        if len(contents) > settings.max_upload_mb * 1024 * 1024:
            raise FileTooLargeError(f"File exceeds {settings.max_upload_mb} MB")
        try:
            img = Image.open(BytesIO(contents))
            img.verify()
            # `verify()` consumes the stream — reopen
            return Image.open(BytesIO(contents)).convert("RGB")
        except (UnidentifiedImageError, OSError) as e:
            raise InvalidFileError("Image could not be decoded", detail=str(e))
```

### `app/services/prediction_service.py`

```python
from datetime import datetime, timezone
import json
from pathlib import Path

from app.ml.inference import InferenceEngine
from app.services.image_service import ImageService
from app.schemas.prediction import PredictionResult
from app.schemas.model_info import ModelInfo, TrainingMetrics
from app.config import settings


class PredictionService:
    def __init__(self, engine: InferenceEngine):
        self.engine = engine
        self.image_service = ImageService()
        self._cached_info: ModelInfo | None = None

    async def predict_bytes(self, contents: bytes, filename: str | None,
                            content_type: str | None, include_heatmap: bool) -> PredictionResult:
        img = self.image_service.validate_and_open(contents, content_type)
        out = self.engine.predict(img, include_heatmap=include_heatmap)
        return PredictionResult(
            label=out["label"],
            confidence=out["confidence"],
            probabilities=out["probabilities"],
            heatmap_base64=out["heatmap_base64"] if include_heatmap else None,
            heatmap_raw_base64=out["heatmap_raw_base64"] if include_heatmap else None,
            model_arch=self.engine.arch,
            inference_ms=out["inference_ms"],
            input_size=self.engine.input_size,
            timestamp=datetime.now(timezone.utc),
        )

    def get_model_info(self) -> ModelInfo:
        if self._cached_info: return self._cached_info

        n_total = sum(p.numel() for p in self.engine.model.parameters())
        n_train = sum(p.numel() for p in self.engine.model.parameters() if p.requires_grad)

        metrics_path = Path(settings.model_path).with_suffix(".metrics.json")
        train_metrics, cross_gen, jpeg_robust = None, [], {}
        if metrics_path.exists():
            data = json.loads(metrics_path.read_text())
            train_metrics = TrainingMetrics(**data["training_metrics"]) if "training_metrics" in data else None
            cross_gen = data.get("cross_generator_results", [])
            jpeg_robust = data.get("jpeg_robustness", {})

        self._cached_info = ModelInfo(
            arch=self.engine.arch,
            input_size=self.engine.input_size,
            parameters_total=n_total,
            parameters_trainable=n_train,
            device=str(self.engine.device),
            checkpoint_loaded_at=self.engine.loaded_at,
            training_metrics=train_metrics,
            cross_generator_results=cross_gen,
            jpeg_robustness=jpeg_robust,
        )
        return self._cached_info
```

### `app/services/url_fetch_service.py`

```python
import httpx
from app.api.errors import URLFetchError


class URLFetchService:
    def __init__(self, timeout_s: int, max_mb: int, user_agent: str):
        self.timeout_s = timeout_s
        self.max_bytes = max_mb * 1024 * 1024
        self.user_agent = user_agent

    async def fetch(self, url: str) -> tuple[bytes, str | None]:
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_s,
                headers={"User-Agent": self.user_agent},
                follow_redirects=True,
            ) as client:
                async with client.stream("GET", url) as resp:
                    if resp.status_code >= 400:
                        raise URLFetchError(f"Upstream returned {resp.status_code}")
                    content_type = resp.headers.get("content-type")
                    chunks, total = [], 0
                    async for chunk in resp.aiter_bytes():
                        total += len(chunk)
                        if total > self.max_bytes:
                            raise URLFetchError("Remote file too large")
                        chunks.append(chunk)
                    return b"".join(chunks), content_type
        except httpx.HTTPError as e:
            raise URLFetchError("URL fetch failed", detail=str(e))
```

### `app/services/report_service.py`

```python
from io import BytesIO
import base64
from datetime import datetime
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image

from app.schemas.report import ReportRequest


class ReportService:
    def __init__(self, public_app_url: str):
        self.public_app_url = public_app_url
        # If Hebrew rendering is needed, register a Hebrew-capable TTF here.
        # pdfmetrics.registerFont(TTFont("Heebo", "assets/Heebo-Regular.ttf"))

    def build_pdf(self, payload: ReportRequest) -> bytes:
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        W, H = A4

        # Header
        c.setFillColor(colors.HexColor("#1F3A68"))
        c.setFont("Helvetica-Bold", 24)
        c.drawString(2 * cm, H - 2.5 * cm, "RealOrFake — Detection Report")
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)
        c.drawString(2 * cm, H - 3.1 * cm, f"Generated: {datetime.utcnow().isoformat()}Z")

        # Label + confidence
        c.setFont("Helvetica-Bold", 18)
        label_color = "#C81E1E" if payload.prediction.label == "ai_generated" else "#1F7A3A"
        c.setFillColor(colors.HexColor(label_color))
        c.drawString(2 * cm, H - 4.5 * cm,
                     f"Verdict: {payload.prediction.label.upper()}  "
                     f"({payload.prediction.confidence * 100:.1f}% confidence)")
        c.setFillColor(colors.black)

        # Original image
        orig = self._decode_png(payload.original_image_base64)
        self._draw_image(c, orig, x=2 * cm, y=H - 13 * cm, max_w=8 * cm, max_h=8 * cm,
                         caption="Original")
        # Heatmap (if present)
        if payload.prediction.heatmap_base64:
            heat = self._decode_png(payload.prediction.heatmap_base64)
            self._draw_image(c, heat, x=11 * cm, y=H - 13 * cm, max_w=8 * cm, max_h=8 * cm,
                             caption="Grad-CAM overlay")

        # Probabilities
        y = H - 15 * cm
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2 * cm, y, "Probabilities")
        c.setFont("Helvetica", 11)
        for i, (k, v) in enumerate(payload.prediction.probabilities.items()):
            c.drawString(2 * cm, y - (i + 1) * 0.55 * cm, f"  {k}:  {v * 100:.2f}%")

        # Model info
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2 * cm, H - 18 * cm, "Model")
        c.setFont("Helvetica", 10)
        c.drawString(2 * cm, H - 18.6 * cm,
                     f"Architecture: {payload.prediction.model_arch}    "
                     f"Input size: {payload.prediction.input_size}px    "
                     f"Inference: {payload.prediction.inference_ms} ms")

        # Notes
        if payload.notes:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(2 * cm, H - 20 * cm, "Notes")
            text = c.beginText(2 * cm, H - 20.6 * cm)
            text.setFont("Helvetica", 10)
            for line in payload.notes.splitlines():
                text.textLine(line[:110])
            c.drawText(text)

        # QR code → app
        qr_img = qrcode.make(self.public_app_url)
        qr_bytes = BytesIO(); qr_img.save(qr_bytes, format="PNG"); qr_bytes.seek(0)
        from reportlab.lib.utils import ImageReader
        c.drawImage(ImageReader(qr_bytes), W - 4.5 * cm, 2 * cm,
                    width=2.5 * cm, height=2.5 * cm, mask="auto")
        c.setFont("Helvetica", 8)
        c.drawString(W - 4.5 * cm, 1.7 * cm, "Try it: realorfake.app")

        c.showPage()
        c.save()
        return buf.getvalue()

    def _decode_png(self, b64: str) -> Image.Image:
        return Image.open(BytesIO(base64.b64decode(b64))).convert("RGB")

    def _draw_image(self, c, img: Image.Image, x, y, max_w, max_h, caption: str):
        from reportlab.lib.utils import ImageReader
        w, h = img.size
        ratio = min(max_w / w, max_h / h)
        new_w, new_h = w * ratio, h * ratio
        buf = BytesIO(); img.save(buf, format="PNG"); buf.seek(0)
        c.drawImage(ImageReader(buf), x, y, width=new_w, height=new_h, mask="auto")
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(x, y - 0.5 * cm, caption)
```

---

## 16. Training pipeline (offline)

### `training/scripts/prepare_data.py`

CLI script that downloads CIFAKE (via `kagglehub` or manual zip), shuffles, splits, and lays out the directory structure expected by `CIFAKEDataset`. Inputs: `--source-dir`, `--out-dir`, `--val-fraction`, `--test-fraction`, `--seed`. Idempotent.

### `training/configs/vit.yaml`

```yaml
arch: vit_b_16
input_size: 224
batch_size: 64
num_workers: 4

optimizer:
  name: adamw
  lr: 1.0e-4
  weight_decay: 1.0e-5

scheduler:
  name: cosine
  warmup_epochs: 1

epochs: 20
early_stopping:
  patience: 4
  min_delta: 1.0e-4

loss: cross_entropy

freeze_backbone: true
mixed_precision: true

logging:
  log_dir: runs/vit_b_16
  log_every_n_steps: 50
  save_top_k: 2

augmentations:
  jpeg_compression:
    enabled: true
    probabilities: [0.0, 0.4, 0.6]
    qualities: [95, 70, 40]
```

(Analogous YAMLs for `baseline.yaml`, `efficientnet.yaml`.)

### `training/scripts/train.py`

Full training loop. Key points to implement:

- Parses YAML via `PyYAML`.
- Builds dataset/loader with `CIFAKEDataset` + appropriate transforms.
- Builds model via `factory.build_model(arch, freeze_backbone=cfg.freeze_backbone)`.
- Optimizer: `torch.optim.AdamW` over `[p for p in model.parameters() if p.requires_grad]`.
- Scheduler: `torch.optim.lr_scheduler.CosineAnnealingLR`.
- `torch.cuda.amp.GradScaler` if `mixed_precision`.
- Logs train/val loss + accuracy each epoch to TensorBoard (`SummaryWriter`).
- Checkpoints best (lowest val loss) to `models/best_model.pth` AND `models/best_model.ckpt.json` (config snapshot).
- Early stopping per config.

```python
# Skeleton — implement full
import argparse, yaml, torch, torch.nn.functional as F
from pathlib import Path
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from app.ml.dataset import CIFAKEDataset
from app.ml.transforms import build_train_transform, build_eval_transform
from app.ml.models.factory import build_model

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--data-root", required=True)
    parser.add_argument("--out-dir", default="models")
    args = parser.parse_args()

    cfg = yaml.safe_load(open(args.config))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_ds = CIFAKEDataset(args.data_root, "train", transform=build_train_transform(cfg["input_size"]))
    val_ds   = CIFAKEDataset(args.data_root, "val",   transform=build_eval_transform(cfg["input_size"]))
    train_loader = DataLoader(train_ds, batch_size=cfg["batch_size"], shuffle=True,
                              num_workers=cfg["num_workers"], pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=cfg["batch_size"], shuffle=False,
                              num_workers=cfg["num_workers"], pin_memory=True)

    model = build_model(cfg["arch"], num_classes=2, freeze_backbone=cfg["freeze_backbone"]).to(device)
    optim = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=cfg["optimizer"]["lr"],
        weight_decay=cfg["optimizer"]["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optim, T_max=cfg["epochs"])
    scaler = torch.cuda.amp.GradScaler(enabled=cfg["mixed_precision"])
    writer = SummaryWriter(cfg["logging"]["log_dir"])

    best_val = float("inf")
    patience_left = cfg["early_stopping"]["patience"]

    for epoch in range(cfg["epochs"]):
        model.train(); train_loss = 0.0
        for step, (x, y) in enumerate(train_loader):
            x, y = x.to(device), y.to(device)
            optim.zero_grad(set_to_none=True)
            with torch.cuda.amp.autocast(enabled=cfg["mixed_precision"]):
                logits = model(x)
                loss = F.cross_entropy(logits, y)
            scaler.scale(loss).backward()
            scaler.step(optim); scaler.update()
            train_loss += loss.item() * x.size(0)
        scheduler.step()
        train_loss /= len(train_ds)

        # Validation
        model.eval(); val_loss, correct = 0.0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits = model(x)
                val_loss += F.cross_entropy(logits, y, reduction="sum").item()
                correct += (logits.argmax(1) == y).sum().item()
        val_loss /= len(val_ds); val_acc = correct / len(val_ds)

        writer.add_scalar("loss/train", train_loss, epoch)
        writer.add_scalar("loss/val", val_loss, epoch)
        writer.add_scalar("acc/val", val_acc, epoch)
        print(f"epoch {epoch}: train={train_loss:.4f} val={val_loss:.4f} val_acc={val_acc:.4f}")

        # Early stopping + best checkpoint
        if val_loss < best_val - cfg["early_stopping"]["min_delta"]:
            best_val = val_loss
            patience_left = cfg["early_stopping"]["patience"]
            Path(args.out_dir).mkdir(exist_ok=True, parents=True)
            torch.save(model.state_dict(), f"{args.out_dir}/best_model.pth")
        else:
            patience_left -= 1
            if patience_left <= 0:
                print("Early stop."); break

if __name__ == "__main__":
    main()
```

### `training/scripts/evaluate.py`

- Loads checkpoint, runs the test split.
- Computes Accuracy, Precision/Recall/F1 per class, Confusion matrix, ROC + AUC.
- Saves figures: `confusion_matrix.png`, `roc_curve.png`.
- Writes `models/best_model.metrics.json` consumed by `/api/model/info`.

### `training/scripts/cross_generator_test.py`

- Takes folders of images from generators NOT used in training (DALL-E, Midjourney, Felora outputs).
- Reports accuracy per generator + per JPEG quality.
- Adds entries to `best_model.metrics.json` under `cross_generator_results` and `jpeg_robustness`.

---

## 17. Logging & utilities

### `app/utils/logging.py`

```python
import logging, sys

def setup_logging(level: str = "INFO"):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s :: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    ))
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]
```

### `app/utils/image_io.py`

Helpers: `bytes_to_pil`, `pil_to_b64`, `b64_to_pil`.

### `app/utils/timing.py`

Decorator and `Timer` context manager for inline ms timing.

---

## 18. Testing

### `tests/conftest.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from pathlib import Path

@pytest.fixture(scope="session")
def app():
    # Test config should point MODEL_PATH at a tiny test checkpoint OR
    # mock the inference engine. See test_api_predict.py.
    return create_app()

@pytest.fixture(scope="session")
def client(app):
    with TestClient(app) as c:
        yield c

@pytest.fixture
def real_image_bytes():
    return (Path("tests/fixtures/real_sample.jpg")).read_bytes()

@pytest.fixture
def fake_image_bytes():
    return (Path("tests/fixtures/fake_sample.jpg")).read_bytes()
```

### Required test cases

- `test_api_health.py` — `GET /health` returns 200, `model_loaded` field present.
- `test_api_predict.py`:
  - `POST /api/predict` with valid image → 200, valid `PredictionResult` shape.
  - With oversized file → 413 + `FILE_TOO_LARGE`.
  - With bad MIME (`text/plain`) → 400 + `INVALID_FILE`.
  - With corrupted image bytes → 400 + `INVALID_FILE`.
  - `include_heatmap=false` → `heatmap_base64` is `None`.
- `test_api_predict_url.py`:
  - Mocked URL fetch returning bytes → 200.
  - Mocked 404 → 400 + `URL_FETCH_FAILED`.
- `test_inference.py`:
  - Builds each model arch, runs forward on a dummy tensor → shape `[1, 2]`.
  - `BaselineCNN.gradcam_target_layers` returns a non-empty list.
- `test_schemas.py`:
  - `PredictionResult` rejects `confidence > 1.0`.
  - `BatchPredictionResponse` enforces non-negative counts.
- `test_image_service.py`:
  - Validates valid JPEG → returns PIL Image.
  - Rejects non-image bytes.

CI target: `pytest -q --cov=app --cov-report=term-missing` with ≥ 80% coverage on `app/services/` and `app/ml/inference.py`.

---

## 19. Deployment

### `Dockerfile`

```dockerfile
FROM python:3.11-slim AS base
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

# System deps for opencv-python-headless and torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
# CPU-only torch wheel for production
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.4.1 torchvision==0.19.1 \
 && pip install -r requirements.txt

COPY app ./app
COPY models ./models

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `render.yaml`

```yaml
services:
  - type: web
    name: realorfake-backend
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: APP_ENV
        value: production
      - key: MODEL_ARCH
        value: vit_b_16
      - key: MODEL_PATH
        value: models/best_model.pth
      - key: CORS_ORIGINS
        value: https://realorfake.vercel.app
      - key: PUBLIC_APP_URL
        value: https://realorfake.vercel.app
```

### `docker-compose.yml` (local dev)

```yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    volumes:
      - ./app:/app/app
      - ./models:/app/models
```

---

## 20. README content (for the repo)

The generated `README.md` must include, at minimum:

1. Project summary (1 paragraph)
2. Quickstart (3 commands: install, run, test)
3. Environment variables table
4. API overview table (linking to `/docs`)
5. Training: how to run `train.py` with each config
6. How to drop a new checkpoint into the API
7. Course-requirements mapping (copy section 1 above)
8. License (MIT)

---

## 21. Acceptance criteria (definition of done)

- [ ] `uvicorn app.main:app --reload` boots and `/health` returns `model_loaded: true` after a checkpoint is placed at `models/best_model.pth`.
- [ ] `POST /api/predict` returns a well-formed `PredictionResult` for a JPEG under 10 MB.
- [ ] `include_heatmap=true` returns a non-empty `heatmap_base64` that decodes to a valid PNG.
- [ ] `POST /api/predict/url` works for a publicly reachable image URL.
- [ ] `POST /api/predict/batch` returns mixed `results[]` / `errors[]` when given a mix of valid + invalid files.
- [ ] `POST /api/report` returns a downloadable PDF with original image, heatmap, label, confidence, model info, and a QR code.
- [ ] All three architectures (`baseline_cnn`, `efficientnet_b0`, `vit_b_16`) instantiate and forward without errors via `factory.build_model`.
- [ ] `training/scripts/train.py --config training/configs/vit.yaml` runs end-to-end on a tiny test set and produces `models/best_model.pth`.
- [ ] `evaluate.py` produces `confusion_matrix.png`, `roc_curve.png`, and `best_model.metrics.json` with shape matching `TrainingMetrics`.
- [ ] `/api/model/info` returns parameter counts plus the contents of `best_model.metrics.json` if present.
- [ ] `pytest` passes with the test cases listed in §18.
- [ ] OpenAPI docs at `/docs` show every schema in §5 with examples.
- [ ] Docker image builds and runs locally.
- [ ] CORS allows the production frontend origin.

---

## 22. Notes for the implementer

- **Do not** import `app.api.errors` from `app/ml/*`. Keep ML modules framework-agnostic; raise their own errors and let services translate.
- **Do not** cache predictions; each request runs through the model. Caching is out of scope.
- **Heatmap base64** is a PNG, no `data:image/png;base64,` prefix. The frontend adds the prefix when assigning to `img.src`.
- **Heatmap target layer for ViT** must use the reshape transform — see `vit.py`. Forgetting this is the most common Grad-CAM bug.
- Keep the **model loaded once** at app startup. Reloading per request will blow latency from ~300 ms to seconds.
- The training scripts run in **Colab**, not in production. Don't import FastAPI-related modules in them.
- All datetimes are **UTC** and ISO-8601 with `Z` suffix.
- All image base64 strings are **without** the `data:` prefix.

---

## 23. Out of scope (do not build)

- Authentication / user accounts.
- Database persistence of predictions.
- Rate limiting (Render front-door handles abuse for the academic demo).
- Webhooks, queueing, async jobs. Inference is fast enough to handle inline.
- Video frame extraction (mentioned as a stretch goal in the proposal — leave for later if time allows; do not block on it).

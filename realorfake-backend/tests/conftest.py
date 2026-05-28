from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Stub out torch and torchvision so tests run without a torch installation.
def _make_torch_stub() -> ModuleType:
    torch = MagicMock(name="torch")
    torch.no_grad = MagicMock(return_value=MagicMock(__enter__=MagicMock(return_value=None), __exit__=MagicMock(return_value=False)))
    torch.load = MagicMock(return_value={})
    torch.device = MagicMock(side_effect=lambda x: x)
    torch.Tensor = MagicMock
    return torch

for _mod in ("torch", "torch.nn", "torch.nn.functional", "torchvision",
             "torchvision.models", "torchvision.transforms",
             "torchvision.transforms.functional",
             "pytorch_grad_cam", "pytorch_grad_cam.utils",
             "pytorch_grad_cam.utils.model_targets",
             "pytorch_grad_cam.utils.image"):
    sys.modules.setdefault(_mod, _make_torch_stub())

from app.main import create_app


FIXTURE_DIR = Path(__file__).parent / "fixtures"

DUMMY_PREDICTION = {
    "label": "real",
    "confidence": 0.92,
    "probabilities": {"real": 0.92, "ai_generated": 0.08},
    "heatmap_base64": None,
    "heatmap_raw_base64": None,
    "inference_ms": 120,
}


@pytest.fixture(scope="session")
def mock_engine():
    engine = MagicMock()
    engine.is_loaded = True
    engine.arch = "vit_b_16"
    engine.input_size = 224
    engine.device = "cpu"
    engine.loaded_at = datetime.now(timezone.utc)
    engine.model = MagicMock()
    engine.model.parameters.return_value = []
    engine.predict.return_value = DUMMY_PREDICTION
    return engine


@pytest.fixture(scope="session")
def app():
    return create_app()


@pytest.fixture(scope="session")
def client(app, mock_engine):
    with TestClient(app) as c:
        # Lifespan runs before this line — inject the mock now to override
        # the real (unloaded) engine created by lifespan.
        from app.services.prediction_service import PredictionService
        app.state.inference_engine = mock_engine
        app.state.prediction_service = PredictionService(mock_engine)
        yield c


@pytest.fixture
def real_image_bytes():
    return (FIXTURE_DIR / "real_sample.jpg").read_bytes()


@pytest.fixture
def fake_image_bytes():
    return (FIXTURE_DIR / "fake_sample.jpg").read_bytes()

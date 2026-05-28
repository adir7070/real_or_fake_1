from datetime import datetime, timezone
import pytest
from pydantic import ValidationError

from app.schemas.prediction import PredictionResult
from app.schemas.batch import BatchPredictionResponse


def _valid_result(**overrides) -> dict:
    base = dict(
        label="real",
        confidence=0.9,
        probabilities={"real": 0.9, "ai_generated": 0.1},
        model_arch="vit_b_16",
        inference_ms=100,
        input_size=224,
        timestamp=datetime.now(timezone.utc),
    )
    base.update(overrides)
    return base


def test_prediction_result_valid():
    r = PredictionResult(**_valid_result())
    assert r.label == "real"


def test_prediction_result_rejects_confidence_above_1():
    with pytest.raises(ValidationError):
        PredictionResult(**_valid_result(confidence=1.5))


def test_prediction_result_rejects_confidence_below_0():
    with pytest.raises(ValidationError):
        PredictionResult(**_valid_result(confidence=-0.1))


def test_batch_response_non_negative():
    resp = BatchPredictionResponse(
        results=[],
        errors=[],
        total=0,
        successful=0,
        failed=0,
        total_inference_ms=0,
    )
    assert resp.total == 0


def test_batch_response_rejects_negative_total():
    with pytest.raises(ValidationError):
        BatchPredictionResponse(
            results=[],
            errors=[],
            total=-1,
            successful=0,
            failed=0,
            total_inference_ms=0,
        )

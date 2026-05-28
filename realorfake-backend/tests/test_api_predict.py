import io
import pytest


def test_predict_valid_image(client, real_image_bytes):
    resp = client.post(
        "/api/predict",
        files={"file": ("real.jpg", real_image_bytes, "image/jpeg")},
        data={"include_heatmap": "false"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "label" in data
    assert data["label"] in ("real", "ai_generated")
    assert 0.0 <= data["confidence"] <= 1.0
    assert "probabilities" in data
    assert "model_arch" in data
    assert "inference_ms" in data


def test_predict_returns_no_heatmap_when_disabled(client, real_image_bytes):
    resp = client.post(
        "/api/predict",
        files={"file": ("real.jpg", real_image_bytes, "image/jpeg")},
        data={"include_heatmap": "false"},
    )
    assert resp.status_code == 200
    assert resp.json()["heatmap_base64"] is None


def test_predict_oversized_file(client):
    big = b"x" * (11 * 1024 * 1024)
    resp = client.post(
        "/api/predict",
        files={"file": ("big.jpg", big, "image/jpeg")},
    )
    assert resp.status_code == 413
    assert resp.json()["code"] == "FILE_TOO_LARGE"


def test_predict_bad_mime(client, real_image_bytes):
    resp = client.post(
        "/api/predict",
        files={"file": ("doc.txt", real_image_bytes, "text/plain")},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "INVALID_FILE"


def test_predict_corrupted_bytes(client):
    corrupted = b"not-an-image-at-all-xyz"
    resp = client.post(
        "/api/predict",
        files={"file": ("bad.jpg", corrupted, "image/jpeg")},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "INVALID_FILE"

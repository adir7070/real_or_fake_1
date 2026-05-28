import torch
import pytest

from app.ml.models.factory import build_model


@pytest.mark.parametrize("arch", ["baseline_cnn", "efficientnet_b0", "vit_b_16"])
def test_model_forward_shape(arch):
    model = build_model(arch, num_classes=2, freeze_backbone=True)
    model.eval()
    x = torch.zeros(1, 3, 224, 224)
    with torch.no_grad():
        out = model(x)
    assert out.shape == (1, 2), f"{arch} output shape mismatch: {out.shape}"


def test_baseline_cnn_gradcam_layers():
    model = build_model("baseline_cnn")
    layers = model.gradcam_target_layers  # type: ignore[attr-defined]
    assert len(layers) > 0


def test_efficientnet_gradcam_layers():
    model = build_model("efficientnet_b0")
    layers = model.gradcam_target_layers  # type: ignore[attr-defined]
    assert len(layers) > 0


def test_vit_gradcam_layers():
    model = build_model("vit_b_16")
    layers = model.gradcam_target_layers  # type: ignore[attr-defined]
    assert len(layers) > 0

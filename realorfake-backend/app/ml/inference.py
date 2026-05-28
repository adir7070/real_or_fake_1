from __future__ import annotations

import time
from datetime import datetime, timezone
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image

from app.api.errors import InferenceError, ModelNotLoadedError
from app.ml.gradcam import GradCAMService
from app.ml.models.factory import Arch, build_model
from app.ml.transforms import build_eval_transform

CLASS_NAMES = ["real", "ai_generated"]


class InferenceEngine:
    def __init__(
        self,
        checkpoint_path: str,
        arch: Arch,
        device_pref: str,
        input_size: int,
    ) -> None:
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
        if pref == "cpu":
            return torch.device("cpu")
        if pref == "cuda":
            return torch.device("cuda")
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        if not self.checkpoint_path.exists():
            raise ModelNotLoadedError(
                f"Checkpoint not found: {self.checkpoint_path}"
            )
        model = build_model(self.arch, num_classes=2, freeze_backbone=False)
        state = torch.load(
            self.checkpoint_path, map_location=self.device, weights_only=True
        )
        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        model.load_state_dict(state)
        model.to(self.device).eval()
        self.model = model
        self.gradcam = GradCAMService(
            model=model, arch=self.arch, device=self.device, input_size=self.input_size
        )
        self.loaded_at = datetime.now(timezone.utc)

    def predict(self, img: Image.Image, include_heatmap: bool = True) -> dict:
        if not self.is_loaded:
            raise ModelNotLoadedError("Model not loaded")
        try:
            t0 = time.perf_counter()
            x = self.transform(img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = self.model(x)  # type: ignore[misc]
                probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()

            pred_idx = int(probs.argmax())
            inference_ms = int((time.perf_counter() - t0) * 1000)

            heatmap_b64 = None
            heatmap_raw_b64 = None
            if include_heatmap and self.gradcam is not None:
                heatmap_b64, heatmap_raw_b64 = self.gradcam.compute(
                    img, target_class=pred_idx
                )

            return {
                "label": CLASS_NAMES[pred_idx],
                "confidence": float(probs[pred_idx]),
                "probabilities": {
                    CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
                },
                "heatmap_base64": heatmap_b64,
                "heatmap_raw_base64": heatmap_raw_b64,
                "inference_ms": inference_ms,
            }
        except (ModelNotLoadedError, InferenceError):
            raise
        except Exception as e:
            raise InferenceError("Inference failed", detail=str(e)) from e

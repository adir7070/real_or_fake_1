from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.api.errors import ModelNotLoadedError
from app.config import settings
from app.ml.inference import InferenceEngine
from app.schemas.model_info import ClassMetrics, ConfusionMatrix, CrossGeneratorResult, ModelInfo, TrainingMetrics
from app.schemas.prediction import PredictionResult
from app.services.image_service import ImageService


class PredictionService:
    def __init__(self, engine: InferenceEngine) -> None:
        self.engine = engine
        self.image_service = ImageService()
        self._cached_info: ModelInfo | None = None

    async def predict_bytes(
        self,
        contents: bytes,
        filename: str | None,
        content_type: str | None,
        include_heatmap: bool,
    ) -> PredictionResult:
        if not self.engine.is_loaded:
            raise ModelNotLoadedError("Model not loaded — please provide a checkpoint")

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
        if not self.engine.is_loaded:
            raise ModelNotLoadedError("Model not loaded")

        if self._cached_info:
            return self._cached_info

        n_total = sum(p.numel() for p in self.engine.model.parameters())  # type: ignore[union-attr]
        n_train = sum(
            p.numel()
            for p in self.engine.model.parameters()  # type: ignore[union-attr]
            if p.requires_grad
        )

        metrics_path = Path(settings.model_path).with_suffix(".metrics.json")
        train_metrics: TrainingMetrics | None = None
        cross_gen: list[CrossGeneratorResult] = []
        jpeg_robust: dict[str, float] = {}

        if metrics_path.exists():
            data = json.loads(metrics_path.read_text())
            if "training_metrics" in data:
                train_metrics = TrainingMetrics(**data["training_metrics"])
            cross_gen = [
                CrossGeneratorResult(**r)
                for r in data.get("cross_generator_results", [])
            ]
            jpeg_robust = data.get("jpeg_robustness", {})

        self._cached_info = ModelInfo(
            arch=self.engine.arch,
            input_size=self.engine.input_size,
            parameters_total=n_total,
            parameters_trainable=n_train,
            device=str(self.engine.device),
            checkpoint_loaded_at=self.engine.loaded_at,  # type: ignore[arg-type]
            training_metrics=train_metrics,
            cross_generator_results=cross_gen,
            jpeg_robustness=jpeg_robust,
        )
        return self._cached_info

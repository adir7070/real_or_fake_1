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
    per_class: dict[str, ClassMetrics]


class CrossGeneratorResult(BaseModel):
    generator_name: str
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
    jpeg_robustness: dict[str, float] = {}

from typing import Literal

import torch.nn as nn

from .baseline_cnn import BaselineCNN
from .efficientnet import EfficientNetClassifier
from .vit import ViTClassifier

Arch = Literal["baseline_cnn", "efficientnet_b0", "vit_b_16"]


def build_model(
    arch: Arch, num_classes: int = 2, freeze_backbone: bool = True
) -> nn.Module:
    if arch == "baseline_cnn":
        return BaselineCNN(num_classes=num_classes)
    if arch == "efficientnet_b0":
        return EfficientNetClassifier(
            num_classes=num_classes, freeze_backbone=freeze_backbone
        )
    if arch == "vit_b_16":
        return ViTClassifier(num_classes=num_classes, freeze_backbone=freeze_backbone)
    raise ValueError(f"Unknown arch: {arch}")

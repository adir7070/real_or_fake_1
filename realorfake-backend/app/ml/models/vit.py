import torch
import torch.nn as nn
from torchvision.models import vit_b_16, ViT_B_16_Weights


class ViTClassifier(nn.Module):
    def __init__(self, num_classes: int = 2, freeze_backbone: bool = True) -> None:
        super().__init__()
        self.backbone = vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)
        if freeze_backbone:
            for p in self.backbone.parameters():
                p.requires_grad = False
            for p in self.backbone.encoder.layers[-2:].parameters():
                p.requires_grad = True

        in_features = self.backbone.heads.head.in_features
        self.backbone.heads = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):  # type: ignore[override]
        return self.backbone(x)

    @property
    def gradcam_target_layers(self) -> list:
        return [self.backbone.encoder.layers[-1].ln_1]

    @staticmethod
    def vit_reshape_transform(
        tensor: torch.Tensor, height: int = 14, width: int = 14
    ) -> torch.Tensor:
        # Drop CLS token, reshape to [batch, dim, h, w] for CAM
        result = tensor[:, 1:, :].reshape(
            tensor.size(0), height, width, tensor.size(2)
        )
        return result.permute(0, 3, 1, 2)

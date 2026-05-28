import torch.nn as nn


class BaselineCNN(nn.Module):
    """3 conv blocks + FC. Trained from scratch as a contrast to Transfer Learning."""

    def __init__(self, num_classes: int = 2, input_size: int = 224) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(128, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):  # type: ignore[override]
        x = self.features(x)
        return self.classifier(x)

    @property
    def gradcam_target_layers(self) -> list:
        return [self.features[-2]]  # last Conv2d before MaxPool

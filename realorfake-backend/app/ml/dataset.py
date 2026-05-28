from pathlib import Path
from typing import Callable

from PIL import Image
from torch.utils.data import Dataset

CLASS_TO_IDX = {"real": 0, "ai_generated": 1}


class CIFAKEDataset(Dataset):
    """
    Expected directory layout (after prepare_data.py normalizes CIFAKE):
        data_root/
          train/real/*.jpg
          train/ai_generated/*.jpg
          val/real/*.jpg
          val/ai_generated/*.jpg
          test/real/*.jpg
          test/ai_generated/*.jpg
    """

    def __init__(
        self,
        data_root: str | Path,
        split: str,
        transform: Callable | None = None,
    ) -> None:
        self.root = Path(data_root) / split
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []

        for cls_name, cls_idx in CLASS_TO_IDX.items():
            cls_dir = self.root / cls_name
            if not cls_dir.exists():
                continue
            for p in cls_dir.rglob("*"):
                if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    self.samples.append((p, cls_idx))

        if not self.samples:
            raise RuntimeError(f"No images found under {self.root}")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):  # type: ignore[override]
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label

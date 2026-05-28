"""Prepare CIFAKE dataset into train/val/test splits."""
import argparse
import random
import shutil
from pathlib import Path


CLASS_NAMES = ["real", "ai_generated"]


def collect_images(source_dir: Path) -> dict[str, list[Path]]:
    images: dict[str, list[Path]] = {cls: [] for cls in CLASS_NAMES}
    for cls in CLASS_NAMES:
        cls_dir = source_dir / cls
        if not cls_dir.exists():
            # Try CIFAKE's original REAL/FAKE naming
            alt = {"real": "REAL", "ai_generated": "FAKE"}.get(cls, cls)
            cls_dir = source_dir / alt
        if cls_dir.exists():
            for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
                images[cls].extend(cls_dir.rglob(ext))
    return images


def split_and_copy(
    images: list[Path],
    out_root: Path,
    cls_name: str,
    val_frac: float,
    test_frac: float,
    seed: int,
) -> None:
    random.seed(seed)
    random.shuffle(images)
    n = len(images)
    n_test = int(n * test_frac)
    n_val = int(n * val_frac)
    splits = {
        "test": images[:n_test],
        "val": images[n_test: n_test + n_val],
        "train": images[n_test + n_val:],
    }
    for split, files in splits.items():
        dest = out_root / split / cls_name
        dest.mkdir(parents=True, exist_ok=True)
        for i, src in enumerate(files):
            shutil.copy2(src, dest / f"{i:06d}{src.suffix}")
        print(f"  {split}/{cls_name}: {len(files)} images")


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare CIFAKE dataset")
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--val-fraction", type=float, default=0.1)
    parser.add_argument("--test-fraction", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    source = Path(args.source_dir)
    out = Path(args.out_dir)

    images = collect_images(source)
    for cls, files in images.items():
        print(f"Found {len(files)} {cls} images")
        split_and_copy(
            files, out, cls, args.val_fraction, args.test_fraction, args.seed
        )

    print(f"\nDataset prepared at: {out}")


if __name__ == "__main__":
    main()

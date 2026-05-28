"""
Downloads Defactify dataset directly to disk (streaming, no memory accumulation).
Output:
    data/defactify/train/real/  train/ai_generated/
    data/defactify/val/real/    val/ai_generated/

Usage:
    python3 training/scripts/download_defactify.py --n 80000 --out-dir data/defactify
"""
import argparse
import random
from pathlib import Path
from typing import Optional

from datasets import load_dataset
from PIL import Image

DATASET = "Rajarshi-Roy-research/Defactify_Image_Dataset"
HF_SPLITS = ["train", "validation", "test"]

# Values that indicate a REAL (non-AI) image
REAL_MARKERS = {"real", "0", "true", "authentic", "coco", "photograph"}
# Values that indicate a FAKE (AI-generated) image
FAKE_MARKERS = {
    "fake", "1", "false", "synthetic", "generated", "ai",
    "midjourney", "dalle", "sdxl", "sd", "stablediffusion",
    "deepfake", "artificial",
}


def guess_real_fake(val_a, val_b) -> Optional[str]:
    """Return 'real', 'fake', or None from Label_A / Label_B values."""
    for val in (val_a, val_b):
        if val is None:
            continue
        s = str(val).lower().strip()
        if s in REAL_MARKERS:
            return "real"
        if s in FAKE_MARKERS:
            return "fake"
        # integer 0 = real, 1 = fake
        try:
            i = int(val)
            if i == 0:
                return "real"
            if i == 1:
                return "fake"
        except (ValueError, TypeError):
            pass
    return None


def peek_labels(n: int = 20) -> None:
    """Print first n label values so we can verify detection."""
    print("  בודק ערכי label...")
    ds = load_dataset(DATASET, split="train", streaming=True)
    seen = set()
    for i, item in enumerate(ds):
        if i >= n:
            break
        pair = (item.get("Label_A"), item.get("Label_B"))
        if pair not in seen:
            seen.add(pair)
            cls = guess_real_fake(*pair)
            print(f"    Label_A={pair[0]!r:12} Label_B={str(pair[1])[:30]!r:32} → {cls}")


def download_split(
    hf_split: str,
    train_real: Path, train_fake: Path,
    val_real: Path, val_fake: Path,
    n_per_class: int,
    val_every: int,
    counters: dict,
    resize: int,
) -> bool:
    """Stream hf_split and save images directly to disk. Returns True if target reached."""
    try:
        ds = load_dataset(DATASET, split=hf_split, streaming=True)
    except Exception as e:
        print(f"  דלג split '{hf_split}': {e}")
        return False

    for item in ds:
        rc = counters["real"]
        fc = counters["fake"]

        if rc >= n_per_class and fc >= n_per_class:
            return True

        img = item.get("Image")
        if not isinstance(img, Image.Image):
            continue

        cls = guess_real_fake(item.get("Label_A"), item.get("Label_B"))
        if cls is None:
            continue

        if cls == "real" and rc >= n_per_class:
            continue
        if cls == "fake" and fc >= n_per_class:
            continue

        # Resize
        img = img.convert("RGB")
        w, h = img.size
        scale = resize / max(w, h)
        if scale < 1:
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        # Route to val (every val_every-th) or train
        idx = rc if cls == "real" else fc
        is_val = (idx % val_every == 0)

        if cls == "real":
            out = (val_real if is_val else train_real) / f"{rc:06d}.jpg"
            counters["real"] += 1
        else:
            out = (val_fake if is_val else train_fake) / f"{fc:06d}.jpg"
            counters["fake"] += 1

        img.save(out, "JPEG", quality=85)

        total = counters["real"] + counters["fake"]
        if total % 200 == 0:
            print(
                f"  [{hf_split}] real={counters['real']:>5}  "
                f"fake={counters['fake']:>5}  total={total}", end="\r"
            )

    return counters["real"] >= n_per_class and counters["fake"] >= n_per_class


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=80_000)
    parser.add_argument("--out-dir", default="data/defactify")
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--resize", type=int, default=256)
    args = parser.parse_args()

    n_per_class = args.n // 2
    val_every = max(2, round(1 / args.val_ratio))  # every N-th image → val
    out_root = Path(args.out_dir)

    # Create dirs
    train_real = out_root / "train" / "real"
    train_fake = out_root / "train" / "ai_generated"
    val_real   = out_root / "val"   / "real"
    val_fake   = out_root / "val"   / "ai_generated"
    for d in (train_real, train_fake, val_real, val_fake):
        d.mkdir(parents=True, exist_ok=True)

    print("=" * 58)
    print(f"Defactify — {n_per_class}×2 = {args.n} תמונות, resize={args.resize}px")
    print(f"Val ratio: 1/{val_every} = {100/val_every:.0f}%  |  output: {out_root}")
    print("=" * 58)

    peek_labels()
    print()

    counters = {"real": 0, "fake": 0}

    for split in HF_SPLITS:
        if counters["real"] >= n_per_class and counters["fake"] >= n_per_class:
            break
        print(f"\n  Streaming '{split}'...")
        download_split(
            split,
            train_real, train_fake, val_real, val_fake,
            n_per_class, val_every, counters, args.resize,
        )

    r, f = counters["real"], counters["fake"]
    n_val_r = r // val_every
    n_val_f = f // val_every

    print(f"\n\n{'=' * 58}")
    print(f"✓ הורדה הושלמה!")
    print(f"  train: ~{r - n_val_r} real + ~{f - n_val_f} ai_generated")
    print(f"  val:   ~{n_val_r} real + ~{n_val_f} ai_generated")
    print(f"{'=' * 58}")
    print(f"\nעכשיו הרץ אימון:")
    print(f"  python3 training/scripts/train.py \\")
    print(f"    --config training/configs/defactify_efficientnet.yaml \\")
    print(f"    --data-root {args.out_dir} \\")
    print(f"    --out-dir models/")


if __name__ == "__main__":
    main()

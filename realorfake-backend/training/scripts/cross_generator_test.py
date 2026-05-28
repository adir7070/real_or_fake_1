"""Test model robustness on generators not seen during training."""
import argparse
import io
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from sklearn.metrics import accuracy_score, roc_auc_score
from torch.utils.data import DataLoader, Dataset

from app.ml.models.factory import build_model
from app.ml.transforms import build_eval_transform

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


class GeneratorDataset(Dataset):
    def __init__(self, img_dir: Path, label: int, transform) -> None:
        self.paths = [p for p in img_dir.rglob("*") if p.suffix.lower() in IMG_EXTS]
        self.label = label
        self.transform = transform

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, idx):
        img = Image.open(self.paths[idx]).convert("RGB")
        return self.transform(img), self.label


def test_generator(
    model: torch.nn.Module,
    gen_dir: Path,
    label: int,
    jpeg_quality: int | None,
    device: torch.device,
) -> tuple[np.ndarray, np.ndarray]:
    transform = build_eval_transform(224)
    ds = GeneratorDataset(gen_dir, label, transform)
    if len(ds) == 0:
        return np.array([]), np.array([])
    loader = DataLoader(ds, batch_size=32, num_workers=0)
    all_probs, all_labels = [], []
    with torch.no_grad():
        for x, y in loader:
            if jpeg_quality:
                # Re-compress each image
                compressed = []
                for img_tensor in x:
                    # Denormalize roughly
                    arr = (img_tensor.permute(1, 2, 0).numpy() * 255).astype("uint8")
                    pil = Image.fromarray(arr)
                    buf = io.BytesIO()
                    pil.save(buf, "JPEG", quality=jpeg_quality)
                    buf.seek(0)
                    compressed.append(transform(Image.open(buf).convert("RGB")))
                x = torch.stack(compressed)
            logits = model(x.to(device))
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            all_probs.append(probs)
            all_labels.append(y.numpy())
    return np.concatenate(all_probs), np.concatenate(all_labels)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--arch", default="vit_b_16")
    parser.add_argument(
        "--generator-dirs",
        nargs="+",
        required=True,
        help="Directories of AI-generated images from unseen generators",
    )
    parser.add_argument(
        "--jpeg-qualities",
        nargs="*",
        type=int,
        default=[90, 70, 50, 30],
        help="JPEG quality levels for robustness test",
    )
    parser.add_argument("--out-file", default="models/best_model.metrics.json")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(args.arch, num_classes=2, freeze_backbone=False)
    state = torch.load(args.checkpoint, map_location=device, weights_only=True)
    if "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.to(device).eval()

    cross_results = []
    for gen_path_str in args.generator_dirs:
        gen_path = Path(gen_path_str)
        probs, labels = test_generator(model, gen_path, label=1, jpeg_quality=None, device=device)
        if len(labels) == 0:
            continue
        preds = probs.argmax(axis=1)
        acc = float(accuracy_score(labels, preds))
        auc = float(roc_auc_score(labels, probs[:, 1])) if len(np.unique(labels)) > 1 else 0.0
        cross_results.append({
            "generator_name": gen_path.name,
            "accuracy": acc,
            "auc": auc,
            "n_samples": len(labels),
        })
        print(f"{gen_path.name}: acc={acc:.3f} auc={auc:.3f} n={len(labels)}")

    jpeg_robustness: dict[str, float] = {}
    if args.generator_dirs:
        gen_path = Path(args.generator_dirs[0])
        for q in args.jpeg_qualities:
            probs, labels = test_generator(model, gen_path, label=1, jpeg_quality=q, device=device)
            if len(labels) > 0:
                acc = float(accuracy_score(labels, probs.argmax(axis=1)))
                jpeg_robustness[f"Q{q}"] = acc
                print(f"JPEG Q{q}: acc={acc:.3f}")

    out = Path(args.out_file)
    existing = json.loads(out.read_text()) if out.exists() else {}
    existing["cross_generator_results"] = cross_results
    existing["jpeg_robustness"] = jpeg_robustness
    out.write_text(json.dumps(existing, indent=2))
    print(f"Updated {out}")


if __name__ == "__main__":
    main()

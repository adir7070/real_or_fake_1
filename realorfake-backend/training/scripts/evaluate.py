"""Evaluate a trained checkpoint on the test split."""
import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.metrics import (
    accuracy_score,
    auc,
    classification_report,
    confusion_matrix,
    roc_curve,
)
from torch.utils.data import DataLoader

from app.ml.dataset import CIFAKEDataset, CLASS_TO_IDX
from app.ml.models.factory import build_model
from app.ml.transforms import build_eval_transform

CLASS_NAMES = ["real", "ai_generated"]


def evaluate(checkpoint: Path, data_root: Path, arch: str, out_dir: Path, split: str = "val") -> None:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(arch, num_classes=2, freeze_backbone=False)
    state = torch.load(checkpoint, map_location=device, weights_only=True)
    if "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.to(device).eval()

    ds = CIFAKEDataset(data_root, split, transform=build_eval_transform(224))
    loader = DataLoader(ds, batch_size=64, shuffle=False, num_workers=0)

    all_probs, all_labels = [], []
    with torch.no_grad():
        for x, y in loader:
            logits = model(x.to(device))
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            all_probs.append(probs)
            all_labels.append(y.numpy())

    probs_arr = np.concatenate(all_probs)
    labels_arr = np.concatenate(all_labels)
    preds = probs_arr.argmax(axis=1)

    acc = accuracy_score(labels_arr, preds)
    cm = confusion_matrix(labels_arr, preds)
    tn, fp, fn, tp = cm.ravel()

    fpr, tpr, _ = roc_curve(labels_arr, probs_arr[:, 1])
    roc_auc = auc(fpr, tpr)

    report = classification_report(
        labels_arr, preds, target_names=CLASS_NAMES, output_dict=True
    )

    # Save confusion matrix figure
    out_dir.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots()
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(CLASS_NAMES)
    ax.set_yticklabels(CLASS_NAMES)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(f"Confusion Matrix — Accuracy {acc:.3f}")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="black")
    fig.colorbar(im)
    fig.savefig(out_dir / "confusion_matrix.png", dpi=150, bbox_inches="tight")
    plt.close(fig)

    # Save ROC curve
    fig, ax = plt.subplots()
    ax.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")
    ax.plot([0, 1], [0, 1], "k--")
    ax.set_xlabel("FPR")
    ax.set_ylabel("TPR")
    ax.set_title("ROC Curve")
    ax.legend()
    fig.savefig(out_dir / "roc_curve.png", dpi=150, bbox_inches="tight")
    plt.close(fig)

    metrics = {
        "training_metrics": {
            "accuracy": float(acc),
            "auc": float(roc_auc),
            "confusion_matrix": {
                "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)
            },
            "per_class": {
                cls: {
                    "precision": float(report[cls]["precision"]),
                    "recall": float(report[cls]["recall"]),
                    "f1": float(report[cls]["f1-score"]),
                    "support": int(report[cls]["support"]),
                }
                for cls in CLASS_NAMES
            },
        },
        "cross_generator_results": [],
        "jpeg_robustness": {},
    }

    metrics_path = out_dir / "best_model.metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2))
    print(f"Saved metrics to {metrics_path}")
    print(f"Accuracy: {acc:.4f}  AUC: {roc_auc:.4f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--data-root", required=True)
    parser.add_argument("--arch", default="vit_b_16")
    parser.add_argument("--out-dir", default="models")
    parser.add_argument("--split", default="val", help="Dataset split to evaluate on")
    args = parser.parse_args()
    evaluate(
        Path(args.checkpoint), Path(args.data_root), args.arch, Path(args.out_dir), args.split
    )


if __name__ == "__main__":
    main()

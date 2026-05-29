"""
Generates training curves from the logged epoch results.
Usage: python3 training/scripts/plot_training.py --out-dir models/
"""
import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

EPOCHS     = [0, 1, 2, 3, 4, 5, 6, 7]
TRAIN_LOSS = [0.2388, 0.1158, 0.0895, 0.0694, 0.0549, 0.0483, 0.0402, 0.0353]
VAL_LOSS   = [0.0888, 0.0936, 0.0756, 0.0939, 0.0833, 0.1147, 0.1447, 0.1222]
VAL_ACC    = [0.9763, 0.9774, 0.9828, 0.9818, 0.9818, 0.9789, 0.9759, 0.9808]
BEST_EPOCH = 2


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="models")
    args = parser.parse_args()
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    fig.suptitle("EfficientNet-B0 — Training on Defactify Dataset", fontsize=13, fontweight="bold")

    # Loss curves
    ax1.plot(EPOCHS, TRAIN_LOSS, "o-", color="#2563eb", label="Train Loss")
    ax1.plot(EPOCHS, VAL_LOSS,   "s--", color="#dc2626", label="Val Loss")
    ax1.axvline(BEST_EPOCH, color="green", linestyle=":", linewidth=1.5, label=f"Best epoch ({BEST_EPOCH})")
    ax1.scatter([BEST_EPOCH], [VAL_LOSS[BEST_EPOCH]], color="green", s=100, zorder=5)
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss (weighted cross-entropy)")
    ax1.set_title("Loss Curves")
    ax1.legend()
    ax1.grid(alpha=0.3)
    ax1.set_xticks(EPOCHS)

    # Accuracy curve
    ax2.plot(EPOCHS, [a * 100 for a in VAL_ACC], "D-", color="#7c3aed", label="Val Accuracy")
    ax2.axvline(BEST_EPOCH, color="green", linestyle=":", linewidth=1.5, label=f"Best epoch ({BEST_EPOCH})")
    ax2.scatter([BEST_EPOCH], [VAL_ACC[BEST_EPOCH] * 100], color="green", s=100, zorder=5)
    ax2.annotate(f"{VAL_ACC[BEST_EPOCH]*100:.2f}%",
                 xy=(BEST_EPOCH, VAL_ACC[BEST_EPOCH] * 100),
                 xytext=(BEST_EPOCH + 0.3, VAL_ACC[BEST_EPOCH] * 100 - 0.15),
                 fontsize=10, color="green", fontweight="bold")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy (%)")
    ax2.set_title("Validation Accuracy")
    ax2.legend()
    ax2.grid(alpha=0.3)
    ax2.set_xticks(EPOCHS)
    ax2.set_ylim(97, 99)

    plt.tight_layout()
    out_path = out / "training_curves.png"
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"✓ Saved {out_path}")


if __name__ == "__main__":
    main()

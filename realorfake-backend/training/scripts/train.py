"""Training script for RealOrFake classifiers. Runs in Colab or locally."""
import argparse
import json
from pathlib import Path

import torch
import torch.nn.functional as F
import yaml
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter

from app.ml.dataset import CIFAKEDataset
from app.ml.models.factory import build_model
from app.ml.transforms import build_eval_transform, build_train_transform


def main() -> None:
    parser = argparse.ArgumentParser(description="Train RealOrFake classifier")
    parser.add_argument("--config", required=True, help="Path to YAML config")
    parser.add_argument("--data-root", required=True, help="Dataset root directory")
    parser.add_argument("--out-dir", default="models", help="Output directory")
    args = parser.parse_args()

    cfg = yaml.safe_load(open(args.config))
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    print(f"Using device: {device}")

    train_ds = CIFAKEDataset(
        args.data_root, "train", transform=build_train_transform(cfg["input_size"])
    )
    val_ds = CIFAKEDataset(
        args.data_root, "val", transform=build_eval_transform(cfg["input_size"])
    )
    pin = device.type == "cuda"
    train_loader = DataLoader(
        train_ds,
        batch_size=cfg["batch_size"],
        shuffle=True,
        num_workers=cfg["num_workers"],
        pin_memory=pin,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=cfg["batch_size"],
        shuffle=False,
        num_workers=cfg["num_workers"],
        pin_memory=pin,
    )

    model = build_model(
        cfg["arch"], num_classes=2, freeze_backbone=cfg["freeze_backbone"]
    ).to(device)

    optim = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=cfg["optimizer"]["lr"],
        weight_decay=cfg["optimizer"]["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optim, T_max=cfg["epochs"]
    )
    use_amp = cfg.get("mixed_precision", False) and device.type == "cuda"
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
    writer = SummaryWriter(cfg["logging"]["log_dir"])

    # Auto class weights to handle imbalanced datasets
    class_counts = [0, 0]
    for _, lbl in train_ds.samples:
        class_counts[lbl] += 1
    total_samples = sum(class_counts)
    class_weights = torch.tensor(
        [total_samples / (2.0 * c) if c > 0 else 1.0 for c in class_counts],
        dtype=torch.float32,
    ).to(device)
    print(f"Class counts: real={class_counts[0]}  fake={class_counts[1]}")
    print(f"Class weights: real={class_weights[0]:.3f}  fake={class_weights[1]:.3f}")

    best_val = float("inf")
    patience_left = cfg["early_stopping"]["patience"]
    out_dir = Path(args.out_dir)

    for epoch in range(cfg["epochs"]):
        model.train()
        train_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optim.zero_grad(set_to_none=True)
            with torch.amp.autocast("cuda", enabled=use_amp):
                logits = model(x)
                loss = F.cross_entropy(logits, y, weight=class_weights)
            scaler.scale(loss).backward()
            scaler.step(optim)
            scaler.update()
            train_loss += loss.item() * x.size(0)
        scheduler.step()
        train_loss /= len(train_ds)

        model.eval()
        val_loss, correct = 0.0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits = model(x)
                val_loss += F.cross_entropy(logits, y, weight=class_weights, reduction="sum").item()
                correct += (logits.argmax(1) == y).sum().item()
        val_loss /= len(val_ds)
        val_acc = correct / len(val_ds)

        writer.add_scalar("loss/train", train_loss, epoch)
        writer.add_scalar("loss/val", val_loss, epoch)
        writer.add_scalar("acc/val", val_acc, epoch)
        print(
            f"epoch {epoch:02d}: train={train_loss:.4f} "
            f"val={val_loss:.4f} val_acc={val_acc:.4f}"
        )

        if val_loss < best_val - cfg["early_stopping"]["min_delta"]:
            best_val = val_loss
            patience_left = cfg["early_stopping"]["patience"]
            out_dir.mkdir(exist_ok=True, parents=True)
            torch.save(model.state_dict(), out_dir / "best_model.pth")
            (out_dir / "best_model.ckpt.json").write_text(
                json.dumps({"arch": cfg["arch"], "input_size": cfg["input_size"], "epoch": epoch})
            )
        else:
            patience_left -= 1
            if patience_left <= 0:
                print("Early stopping triggered.")
                break

    writer.close()
    print(f"Training complete. Best checkpoint at {out_dir}/best_model.pth")


if __name__ == "__main__":
    main()

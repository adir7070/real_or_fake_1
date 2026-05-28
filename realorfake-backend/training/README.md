# Training Pipeline

## 1. Prepare data

```bash
python training/scripts/prepare_data.py \
  --source-dir /path/to/cifake \
  --out-dir data/cifake \
  --val-fraction 0.1 \
  --test-fraction 0.1 \
  --seed 42
```

## 2. Train

```bash
# ViT (best accuracy)
python training/scripts/train.py \
  --config training/configs/vit.yaml \
  --data-root data/cifake \
  --out-dir models

# EfficientNet
python training/scripts/train.py \
  --config training/configs/efficientnet.yaml \
  --data-root data/cifake \
  --out-dir models

# Baseline CNN (from scratch, for comparison)
python training/scripts/train.py \
  --config training/configs/baseline.yaml \
  --data-root data/cifake \
  --out-dir models
```

## 3. Evaluate

```bash
python training/scripts/evaluate.py \
  --checkpoint models/best_model.pth \
  --data-root data/cifake \
  --arch vit_b_16 \
  --out-dir models
```

Produces: `models/confusion_matrix.png`, `models/roc_curve.png`, `models/best_model.metrics.json`.

## 4. Cross-generator test

```bash
python training/scripts/cross_generator_test.py \
  --checkpoint models/best_model.pth \
  --arch vit_b_16 \
  --generator-dirs data/dalle3 data/midjourney_v6 \
  --jpeg-qualities 90 70 50 30 \
  --out-file models/best_model.metrics.json
```

## 5. Drop checkpoint into API

Place `best_model.pth` in the `models/` directory and restart the server.

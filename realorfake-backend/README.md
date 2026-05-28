# RealOrFake — Backend

FastAPI + PyTorch service that detects AI-generated images using Transfer Learning (ViT-B/16, EfficientNet-B0, or a baseline CNN). Outputs a label, confidence, and a Grad-CAM heatmap for every uploaded image.

---

## Quickstart

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Open [http://localhost:8000/docs](http://localhost:8000/docs) for the Swagger UI.

> **Note:** Without a trained checkpoint the server starts with `model_loaded: false`.  
> Drop `best_model.pth` into `models/` and restart to enable predictions.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `MODEL_PATH` | `models/best_model.pth` | Path to checkpoint |
| `MODEL_ARCH` | `vit_b_16` | `baseline_cnn` / `efficientnet_b0` / `vit_b_16` |
| `MODEL_DEVICE` | `auto` | `auto` / `cpu` / `cuda` |
| `MODEL_INPUT_SIZE` | `224` | Input image size (px) |
| `MAX_UPLOAD_MB` | `10` | Max upload file size |
| `ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | Accepted MIME types |
| `URL_FETCH_TIMEOUT_S` | `10` | Timeout for URL-fetch requests |
| `REPORT_OUTPUT_DIR` | `/tmp/realorfake-reports` | PDF temp dir |
| `PUBLIC_APP_URL` | `http://localhost:3000` | Embedded in PDF QR codes |

---

## API overview

| Method | Path | Description |
|---|---|---|
| GET  | `/health` | Liveness + readiness |
| GET  | `/api/model/info` | Architecture, parameters, training metrics |
| POST | `/api/predict` | Classify a single uploaded image |
| POST | `/api/predict/url` | Classify an image by URL |
| POST | `/api/predict/batch` | Classify up to 10 images |
| POST | `/api/report` | Generate a PDF report |

Full schema docs: `/docs` (Swagger) or `/redoc`.

---

## Training

```bash
# 1. Prepare CIFAKE dataset
python training/scripts/prepare_data.py \
  --source-dir /path/to/cifake_raw \
  --out-dir data/cifake

# 2. Train ViT (recommended)
python training/scripts/train.py \
  --config training/configs/vit.yaml \
  --data-root data/cifake \
  --out-dir models

# 3. Evaluate
python training/scripts/evaluate.py \
  --checkpoint models/best_model.pth \
  --data-root data/cifake \
  --arch vit_b_16 \
  --out-dir models
```

See [training/README.md](training/README.md) for full details.

---

## Dropping in a new checkpoint

1. Copy `best_model.pth` (and optionally `best_model.metrics.json`) to `models/`.
2. Set `MODEL_ARCH` env var to match the checkpoint architecture.
3. Restart the server.

---

## Course requirements

| Requirement | Where it is addressed |
|---|---|
| Neural network / Transfer Learning | `app/ml/models/` — EfficientNet-B0, ViT-B/16, baseline CNN |
| Real data | CIFAKE (120k images), GenImage, custom set |
| Training process | `training/scripts/train.py` + Colab notebooks |
| Model used inside the app | `app/services/prediction_service.py` |
| Evaluation metrics | `training/scripts/evaluate.py`, `/api/model/info` |
| Library: PyTorch / torchvision | Core stack |
| Library: OpenCV | Image preprocessing in `app/ml/gradcam.py` |
| App library | FastAPI + Next.js (separation of concerns, deployability) |
| User interaction | `POST /api/predict` accepts file or URL |

---

## Tests

```bash
pytest -q --cov=app --cov-report=term-missing
```

---

## License

MIT

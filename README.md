# RealOrFake — האם התמונה הזאת נוצרה ב-AI?

> **תשובה, ביטחון, ומפת חום שמראה *למה*.**
> מעלים תמונה — או מדביקים קישור, או זורקים וידאו — ומקבלים סיווג בין תמונה אמיתית לתמונה שנוצרה
> ב-AI, עם אחוז ביטחון, מפת Grad-CAM שמסמנת את האזורים שהכריעו, ודוח PDF להורדה.

`PyTorch (ViT-B/16 · EfficientNet-B0)` · `FastAPI` · `Next.js 14` · `Grad-CAM` · `OpenCV`

**98.3% דיוק · AUC 0.9986**

---

## מה זה עושה

לפני שנתיים אפשר היה לזהות תמונת AI במבט. היום לא. הנפח מנצח את העין: אין דרך לאמת ידנית מיליוני
תמונות, וכל אחת מהן יכולה להיות ראיה, מודעה, פרופיל מזויף או כתבה.

RealOrFake נותן החלטה מבוססת מודל — ומראה על מה היא נשענת:

| יכולת | endpoint |
| --- | --- |
| סיווג תמונה מהעלאה | `POST /api/predict` |
| סיווג תמונה מ-URL | `POST /api/predict/url` |
| סיווג באצווה (עד 10 תמונות) | `POST /api/predict/batch` |
| **סיווג וידאו** (דגימת פריימים, עד 100MB) | `POST /api/predict/video` |
| דוח PDF עם QR | `POST /api/report` |
| מטא-דאטת המודל ומדדי אימון | `GET /api/model/info` |

---

## מה מייחד את זה

**כל תשובה מגיעה עם הסבר ויזואלי.** Grad-CAM מייצר מפת חום שמסמנת את הפיקסלים שהכריעו את ההחלטה.
מסווג בינארי שאומר "מזויף, 94%" בלי להראות על מה הוא הסתמך הוא קופסה שחורה שאיש לא יכול לערער עליה —
וזה בדיוק מה שהופך אותו לחסר שימוש בהקשר שמישהו צריך *להחליט* משהו על סמך התוצאה.

**שלוש ארכיטקטורות מתחלפות במשתנה סביבה אחד.** `baseline_cnn` (בסיס להשוואה), `efficientnet_b0`
(מהיר, קל), `vit_b_16` (חזק). `MODEL_ARCH` מחליף ביניהן בלי לגעת בקוד — ה-factory ב-
`app/ml/models/factory.py` הוא הנקודה היחידה שיודעת על ההבדל.

**המדדים המדווחים הם אמיתיים ומפורקים לפי מחלקה** — לא מספר יחיד ממורק:

| מדד | ערך |
| --- | --- |
| Accuracy | **98.28%** |
| AUC | **0.9986** |
| מטריצת בלבול | TN 2,172 · FP 114 · FN 24 · TP 5,691 |
| אמיתי — precision / recall / F1 | 0.989 / 0.950 / 0.969 |
| נוצר ב-AI — precision / recall / F1 | 0.980 / **0.996** / 0.988 |

שימו לב לאסימטריה, והיא מכוונת: recall של 99.6% על תמונות AI — המערכת כמעט לא מפספסת מזויף. המחיר
הוא 114 תמונות אמיתיות שסומנו בטעות. בהקשר של זיהוי תוכן מזויף זו העדפה נכונה, וה-README המקורי
של ה-backend חושף אותה במקום להסתיר מאחורי "98%".

**וידאו נבדק פריים-פריים.** `video_service.py` דוגם פריימים, מסווג כל אחד ומאחד לתוצאה — כך שסרטון
לא צריך מודל אחר ולא צריך פייפליין נפרד.

**המודל אופציונלי, השרת לא נופל.** בלי checkpoint מאומן ה-API עולה עם `model_loaded: false` ומדווח
זאת ב-`/health`. אפשר לפתח את הפרונט ואת ה-API בלי 17MB של משקולות.

**דו-לשוני מהיסוד.** ממשק וממצאים בעברית ובאנגלית, כולל `LocaleSwitcher` — לא תרגום שהודבק בסוף.

**גבולות אכיפים.** גודל העלאה מקסימלי, whitelist של MIME types, timeout לשליפת URL, timeout לבקשה —
כל אחד משתנה סביבה, כל אחד עם ברירת מחדל שפויה.

**הפרדה נקייה בין המחקר למוצר.** `training/` (סקריפטים, קונפיגים, notebooks) לא מעורבב עם
`app/` (השירות). אפשר לאמן במקום אחד ולפרוס במקום אחר.

---

## ארכיטקטורה

```text
┌──────────────────────────────────┐
│  realorfake-frontend (Next.js 14)│
│  DropZone · URLInput · VideoDrop │
│  ResultCard · HeatmapView        │
│  ProbabilityTable · ReportButton │
│  ModelInfo · ConfusionMatrix     │
└────────────────┬─────────────────┘
                 │ fetch (JSON / FormData)
                 ▼
┌──────────────────────────────────┐
│  realorfake-backend (FastAPI)    │
│  routes: predict · batch · video │
│          report · model_info     │
│  services: image · prediction    │
│            url_fetch · report    │
│            video                 │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│  PyTorch — ViT-B/16 / EffNet-B0  │
│  + Grad-CAM (OpenCV)             │
└──────────────────────────────────┘
```

---

## התקנה והרצה

### הורדה

```bash
git clone https://github.com/adir7070/real_or_fake_1.git
cd real_or_fake_1
```

### 1 — ה-Backend

```bash
cd realorfake-backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

> ⚠️ **חשוב:** ה-checkpoint המצורף (`models/best_model.pth`, 17MB) הוא **`efficientnet_b0`**
> (epoch 2), אבל ברירת המחדל ב-`.env.example` ובקונפיג היא `vit_b_16`. הגדירו:
> ```env
> MODEL_ARCH=efficientnet_b0
> ```
> אחרת טעינת המשקולות תיכשל. אם אתם מאמנים ViT בעצמכם — החזירו ל-`vit_b_16`.

Swagger UI: <http://localhost:8000/docs> · ReDoc: `/redoc` · בריאות: `/health`

### 2 — ה-Frontend

```bash
cd ../realorfake-frontend
pnpm install                     # דורש Node 20 LTS + pnpm
cp .env.local.example .env.local
# הגדירו NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
pnpm dev
```

האפליקציה: <http://localhost:3000>

### 3 — עם Docker

```bash
cd realorfake-backend
docker-compose up
```

---

## אימון המודל

```bash
# 1. הכנת דאטהסט CIFAKE
python training/scripts/prepare_data.py \
  --source-dir /path/to/cifake_raw \
  --out-dir data/cifake

# 2. אימון ViT (מומלץ)
python training/scripts/train.py \
  --config training/configs/vit.yaml \
  --data-root data/cifake \
  --out-dir models

# 3. הערכה
python training/scripts/evaluate.py \
  --checkpoint models/best_model.pth \
  --data-root data/cifake \
  --arch vit_b_16 \
  --out-dir models
```

קונפיגים נוספים: `training/configs/baseline.yaml`, `efficientnet.yaml`, `vit.yaml`.
פירוט מלא: [`realorfake-backend/training/README.md`](realorfake-backend/training/README.md).

**החלפת checkpoint:** העתיקו `best_model.pth` (ואופציונלית `best_model.metrics.json`) ל-`models/`,
הגדירו `MODEL_ARCH` שמתאים לו, והפעילו מחדש את השרת.

---

## משתני סביבה

### `realorfake-backend/.env`

| משתנה | ברירת מחדל | תיאור |
| --- | --- | --- |
| `APP_ENV` | `development` | `development` / `production` |
| `LOG_LEVEL` | `INFO` | רמת לוג |
| `HOST` · `PORT` | `0.0.0.0` · `8000` | כתובת ופורט |
| `CORS_ORIGINS` | `http://localhost:3000` | origins מותרים (מופרד בפסיקים) |
| `MODEL_PATH` | `models/best_model.pth` | נתיב ה-checkpoint |
| `MODEL_ARCH` | `vit_b_16` | `baseline_cnn` / `efficientnet_b0` / `vit_b_16` |
| `MODEL_DEVICE` | `auto` | `auto` / `cpu` / `cuda` |
| `MODEL_INPUT_SIZE` | `224` | גודל קלט בפיקסלים |
| `MAX_UPLOAD_MB` | `10` | גודל העלאה מקסימלי |
| `ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | סוגי קבצים מותרים |
| `URL_FETCH_TIMEOUT_S` | `10` | timeout לשליפת URL |
| `REPORT_OUTPUT_DIR` | `/tmp/realorfake-reports` | תיקיית PDF זמנית |
| `PUBLIC_APP_URL` | `http://localhost:3000` | מוטמע ב-QR של הדוח |

### `realorfake-frontend/.env.local`

| משתנה | חובה | תיאור |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | **כן** | כתובת ה-backend |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | לא | `he` / `en` (ברירת מחדל `he`) |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | לא | `10` |
| `NEXT_PUBLIC_ALLOWED_MIME` | לא | סוגי קבצים |
| `NEXT_PUBLIC_GA_ID` | לא | Google Analytics (ריק = כבוי) |

---

## בדיקות

```bash
cd realorfake-backend  && pytest -q --cov=app --cov-report=term-missing
cd realorfake-frontend && pnpm test && pnpm typecheck && pnpm lint
```

---

## מבנה הריפו

```text
realorfake-backend/
  ├── app/api/routes/     predict · batch · video · report · model_info · health
  ├── app/ml/             models/ (baseline · effnet · vit · factory)
  │                       gradcam · inference · transforms · augmentations · dataset
  ├── app/services/       image · prediction · url_fetch · report · video
  ├── app/schemas/        סכמות Pydantic
  ├── models/             ⭐ best_model.pth + metrics.json + גרפי אימון
  ├── training/           scripts/ · configs/ · notebooks/
  ├── tests/              בדיקות API · inference · services · schemas
  ├── Dockerfile · docker-compose.yml · render.yaml
realorfake-frontend/
  ├── app/                page · detect · model · about
  ├── components/         detector/ · model/ · layout/ · shared/ · ui/ (shadcn)
report/
  ├── RealOrFake.pdf · RealOrFake_report.pdf   הדוח האקדמי
  └── *.mov                                    הקלטת הדגמה
```

---

## דיפלוי

| שכבה | פלטפורמה | קובץ |
| --- | --- | --- |
| Backend | Render | `realorfake-backend/render.yaml` |
| Frontend | Vercel | `pnpm build` + `NEXT_PUBLIC_API_BASE_URL` |

---
---

# RealOrFake — Was this image generated by AI?

> **An answer, a confidence score, and a heatmap that shows *why*.**
> Upload an image — or paste a URL, or drop a video — and get a real-vs-AI-generated classification
> with a confidence score, a Grad-CAM heatmap marking the regions that decided it, and a
> downloadable PDF report.

`PyTorch (ViT-B/16 · EfficientNet-B0)` · `FastAPI` · `Next.js 14` · `Grad-CAM` · `OpenCV`

**98.3% accuracy · AUC 0.9986**

## What it does

Two years ago you could spot an AI image at a glance. Not anymore — and volume beats the eye: there
is no way to manually verify millions of images, any one of which might be evidence, an ad, a fake
profile, or a news photo.

| Capability | Endpoint |
| --- | --- |
| Classify an uploaded image | `POST /api/predict` |
| Classify an image by URL | `POST /api/predict/url` |
| Batch classify (up to 10) | `POST /api/predict/batch` |
| **Classify video** (frame sampling, up to 100MB) | `POST /api/predict/video` |
| PDF report with QR code | `POST /api/report` |
| Model metadata + training metrics | `GET /api/model/info` |

## What makes it different

- **Every answer ships with a visual explanation.** Grad-CAM produces a heatmap over the pixels that drove the decision. A binary classifier that says "fake, 94%" without showing what it relied on is a black box nobody can challenge — which is exactly what makes it useless when someone has to *decide* something based on the result.
- **Three architectures, switched by one environment variable.** `baseline_cnn`, `efficientnet_b0`, `vit_b_16`. `MODEL_ARCH` swaps them without touching code; `app/ml/models/factory.py` is the only place that knows the difference.
- **Reported metrics are real and broken down per class** — not one polished number: accuracy 98.28%, AUC 0.9986, confusion matrix TN 2,172 / FP 114 / FN 24 / TP 5,691; real 0.989/0.950/0.969 and AI-generated 0.980/**0.996**/0.988 (precision/recall/F1). Note the deliberate asymmetry: **99.6% recall on AI images** — it almost never misses a fake, at the cost of 114 real images flagged wrongly. For fake-content detection that is the right trade, and the repo discloses it instead of hiding behind "98%".
- **Video is checked frame by frame.** `video_service.py` samples frames, classifies each, and aggregates — so video needs neither a different model nor a separate pipeline.
- **The model is optional; the server does not fall over.** Without a trained checkpoint the API boots with `model_loaded: false` and reports it at `/health`, so frontend and API work can proceed without 17MB of weights.
- **Bilingual from the foundation.** UI and findings in Hebrew and English, including a `LocaleSwitcher` — not a translation bolted on at the end.
- **Enforceable limits.** Max upload size, MIME whitelist, URL-fetch timeout, request timeout — each an env var with a sane default.
- **Clean research/product separation.** `training/` (scripts, configs, notebooks) is not mixed into `app/` (the service): train in one place, deploy from another.

## Quickstart

```bash
git clone https://github.com/adir7070/real_or_fake_1.git
cd real_or_fake_1

# Backend
cd realorfake-backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload      # Swagger at http://localhost:8000/docs
```

> ⚠️ **Important:** the shipped checkpoint (`models/best_model.pth`, 17MB) is **`efficientnet_b0`**
> (epoch 2), while the default in `.env.example` and in config is `vit_b_16`. Set
> `MODEL_ARCH=efficientnet_b0` or weight loading will fail. Set it back to `vit_b_16` if you train
> a ViT yourself.

```bash
# Frontend (Node 20 LTS + pnpm)
cd ../realorfake-frontend
pnpm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
pnpm dev                           # http://localhost:3000
```

Docker: `cd realorfake-backend && docker-compose up`.

## Training

```bash
python training/scripts/prepare_data.py --source-dir /path/to/cifake_raw --out-dir data/cifake
python training/scripts/train.py    --config training/configs/vit.yaml --data-root data/cifake --out-dir models
python training/scripts/evaluate.py --checkpoint models/best_model.pth --data-root data/cifake --arch vit_b_16 --out-dir models
```

Dataset: CIFAKE (120k images), plus GenImage and a custom set. Full details in
[`realorfake-backend/training/README.md`](realorfake-backend/training/README.md).

## Environment variables

See the Hebrew tables above for the complete backend (`MODEL_*`, `MAX_UPLOAD_MB`,
`ALLOWED_MIME_TYPES`, `URL_FETCH_TIMEOUT_S`, `REPORT_OUTPUT_DIR`, `PUBLIC_APP_URL`, …) and frontend
(`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE`, …) variable lists.

## Tests

```bash
cd realorfake-backend  && pytest -q --cov=app --cov-report=term-missing
cd realorfake-frontend && pnpm test && pnpm typecheck && pnpm lint
```

## Deployment

Backend on Render (`realorfake-backend/render.yaml`), frontend on Vercel (`pnpm build` plus
`NEXT_PUBLIC_API_BASE_URL`).

## Sub-project documentation

- [`realorfake-backend/README.md`](realorfake-backend/README.md) — API reference, env vars, training, course-requirement mapping
- [`realorfake-frontend/README.md`](realorfake-frontend/README.md) — scripts, architecture diagram, env vars
- `report/RealOrFake_report.pdf` — the academic write-up

## License

MIT (backend).

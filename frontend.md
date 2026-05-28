# RealOrFake — Frontend Specification

> **Document type:** Implementation spec for Claude Code
> **Target:** Complete Next.js 14 frontend that consumes the FastAPI backend defined in `backend.md`
> **Reader:** Assume an autonomous coding agent that will produce a full working project from this document.

---

## 1. Mission & scope

The frontend is a single-purpose web app: the user drops an image, the page sends it to the backend, and the page renders the verdict (real vs. AI-generated), the confidence, and a Grad-CAM heatmap overlaid on the image. The user can download a PDF report. Multiple images can be analyzed at once via batch.

The UI is **Hebrew-first with full RTL** (this is an Israeli academic project and the demo audience speaks Hebrew). English is supported as a secondary locale via a simple i18n dictionary; no `next-intl` server-side routing is needed for v1.

### Course requirements this frontend satisfies

| Course requirement | How it is satisfied |
|---|---|
| User interaction (upload / capture / button) | Drag-and-drop or click-to-upload; URL paste; camera capture on mobile via `<input capture>` |
| Working app with basic UI | Three pages: landing, detector, model info |
| Display of model results | Verdict card, confidence bar, Grad-CAM overlay, probability table |
| Demonstrable in class | Public Vercel URL + sample images bundled in `/public/samples` |

The frontend does **no inference of its own**. All ML happens in the backend.

---

## 2. Tech stack (exact versions)

```
Node                  20 LTS
Next.js               14.2.x  (App Router)
React                 18.3.x
TypeScript            5.5.x  (strict)

Tailwind CSS          3.4.x
tailwindcss-rtl       0.9.x        # logical-property fallbacks
@tailwindcss/typography 0.5.x

shadcn/ui             current
  (button, card, input, label, textarea, dialog,
   tabs, badge, progress, separator, switch,
   sonner [toasts], skeleton, dropdown-menu)
lucide-react          0.451.x      # icons
class-variance-authority 0.7.x
clsx                  2.1.x
tailwind-merge        2.5.x

@tanstack/react-query 5.x
zustand               4.5.x
react-dropzone        14.2.x
react-hook-form       7.53.x
zod                   3.23.x
@hookform/resolvers   3.9.x

recharts              2.13.x       # for confidence bar / probability charts on Model Info page
file-saver            2.0.5        # download PDF blob

vitest                2.1.x        # unit + component tests
@testing-library/react 16.x
@testing-library/jest-dom 6.x
@vitejs/plugin-react  4.x          # for vitest
msw                   2.x          # API mocking in tests

eslint                9.x          # Next config
prettier              3.x
prettier-plugin-tailwindcss 0.6.x
```

---

## 3. Project structure

```
realorfake-frontend/
├── app/
│   ├── layout.tsx                  # Root layout: HTML lang/dir, providers, fonts
│   ├── page.tsx                    # Landing page (/)
│   ├── detect/
│   │   ├── page.tsx                # Main detector page (/detect)
│   │   └── loading.tsx
│   ├── model/
│   │   └── page.tsx                # Model info page (/model)
│   ├── about/
│   │   └── page.tsx                # About page (/about)
│   ├── error.tsx                   # Route segment error boundary
│   ├── not-found.tsx
│   ├── globals.css
│   ├── opengraph-image.png
│   └── favicon.ico
├── components/
│   ├── ui/                         # shadcn/ui generated files (do not edit by hand)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── sonner.tsx
│   │   └── dropdown-menu.tsx
│   ├── detector/
│   │   ├── DetectorPanel.tsx       # Orchestrates the detect page
│   │   ├── DropZone.tsx            # Drag-and-drop + click-to-upload
│   │   ├── URLInput.tsx            # Paste-URL flow
│   │   ├── SampleGallery.tsx       # "Try one of these" sample images
│   │   ├── ResultCard.tsx          # Verdict + confidence
│   │   ├── ConfidenceBar.tsx
│   │   ├── ProbabilityTable.tsx
│   │   ├── HeatmapToggle.tsx       # Slider/switch between original and overlay
│   │   ├── HeatmapView.tsx         # The actual side-by-side or overlay
│   │   ├── BatchList.tsx           # When multiple files dropped
│   │   ├── BatchItemRow.tsx
│   │   ├── ReportButton.tsx        # Triggers /api/report download
│   │   ├── EmptyState.tsx
│   │   ├── DetectorSkeleton.tsx
│   │   └── ExplainerCallout.tsx    # "Why does the model think so?"
│   ├── model/
│   │   ├── ModelInfoCard.tsx
│   │   ├── ConfusionMatrixView.tsx
│   │   ├── CrossGeneratorChart.tsx
│   │   └── JpegRobustnessChart.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Nav.tsx
│   │   └── LocaleSwitcher.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── CopyableHash.tsx
│       └── ExternalLink.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts               # Low-level fetch wrapper
│   │   ├── prediction.ts           # Typed API functions
│   │   ├── report.ts
│   │   ├── model.ts
│   │   ├── health.ts
│   │   └── types.ts                # TypeScript mirrors of backend schemas
│   ├── hooks/
│   │   ├── usePrediction.ts
│   │   ├── useBatchPrediction.ts
│   │   ├── usePredictionFromUrl.ts
│   │   ├── useReport.ts
│   │   ├── useModelInfo.ts
│   │   ├── useHealth.ts
│   │   ├── useImageDropzone.ts
│   │   └── useCopyToClipboard.ts
│   ├── store/
│   │   └── detection-store.ts      # Zustand: current detection session
│   ├── i18n/
│   │   ├── dictionary.ts           # he + en strings
│   │   ├── useTranslation.ts
│   │   └── locale-context.tsx
│   ├── utils/
│   │   ├── cn.ts                   # clsx + tailwind-merge
│   │   ├── format.ts               # number/date formatters
│   │   ├── image.ts                # blob ↔ base64
│   │   ├── file-validation.ts
│   │   └── download.ts             # file-saver wrapper
│   └── config/
│       └── env.ts                  # Zod-validated public env
├── public/
│   ├── samples/
│   │   ├── real_01.jpg
│   │   ├── real_02.jpg
│   │   ├── fake_01.jpg
│   │   └── fake_02.jpg
│   ├── logo.svg
│   └── README.md                   # which samples were generated by which model
├── styles/
│   └── (extra global CSS lives in app/globals.css; this dir is reserved)
├── tests/
│   ├── setup.ts
│   ├── components/
│   │   ├── ResultCard.test.tsx
│   │   ├── ConfidenceBar.test.tsx
│   │   └── DropZone.test.tsx
│   ├── hooks/
│   │   ├── usePrediction.test.ts
│   │   └── useBatchPrediction.test.ts
│   ├── utils/
│   │   ├── file-validation.test.ts
│   │   └── image.test.ts
│   └── mocks/
│       ├── handlers.ts             # MSW
│       ├── server.ts
│       └── fixtures.ts
├── .env.local.example
├── .gitignore
├── .nvmrc                          # 20
├── components.json                 # shadcn config
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── prettier.config.mjs
├── package.json
└── README.md
```

---

## 4. Environment & config

### `.env.local.example`

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional
NEXT_PUBLIC_DEFAULT_LOCALE=he         # he | en
NEXT_PUBLIC_MAX_UPLOAD_MB=10
NEXT_PUBLIC_ALLOWED_MIME=image/jpeg,image/png,image/webp
NEXT_PUBLIC_GA_ID=                    # leave blank to disable
```

### `lib/config/env.ts`

```ts
import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["he", "en"]).default("he"),
  NEXT_PUBLIC_MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
  NEXT_PUBLIC_ALLOWED_MIME: z.string().default("image/jpeg,image/png,image/webp"),
  NEXT_PUBLIC_GA_ID: z.string().optional().default(""),
});

const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_MAX_UPLOAD_MB: process.env.NEXT_PUBLIC_MAX_UPLOAD_MB,
  NEXT_PUBLIC_ALLOWED_MIME: process.env.NEXT_PUBLIC_ALLOWED_MIME,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
});

if (!parsed.success) {
  console.error("Invalid env:", parsed.error.flatten());
  throw new Error("Invalid environment variables.");
}

export const env = {
  ...parsed.data,
  ALLOWED_MIME_SET: new Set(parsed.data.NEXT_PUBLIC_ALLOWED_MIME.split(",").map(s => s.trim())),
};
```

---

## 5. TypeScript types (mirror of backend schemas)

### `lib/api/types.ts`

```ts
export type Label = "real" | "ai_generated";

export interface PredictionResult {
  label: Label;
  confidence: number;                         // 0..1
  probabilities: Record<Label, number>;
  heatmap_base64: string | null;              // PNG without data: prefix
  heatmap_raw_base64: string | null;
  model_arch: string;
  inference_ms: number;
  input_size: number;
  timestamp: string;                          // ISO-8601
}

export interface PredictionRequestURL {
  url: string;
  include_heatmap: boolean;
}

export interface BatchItemError {
  index: number;
  filename: string | null;
  error: string;
  code: string;
}

export interface BatchPredictionResponse {
  results: PredictionResult[];
  errors: BatchItemError[];
  total: number;
  successful: number;
  failed: number;
  total_inference_ms: number;
}

export interface ConfusionMatrix { tn: number; fp: number; fn: number; tp: number; }
export interface ClassMetrics { precision: number; recall: number; f1: number; support: number; }
export interface TrainingMetrics {
  accuracy: number;
  auc: number;
  confusion_matrix: ConfusionMatrix;
  per_class: Record<"real" | "ai_generated", ClassMetrics>;
}
export interface CrossGeneratorResult {
  generator_name: string;
  accuracy: number;
  auc: number;
  n_samples: number;
}
export interface ModelInfo {
  arch: string;
  input_size: number;
  parameters_total: number;
  parameters_trainable: number;
  device: string;
  checkpoint_loaded_at: string;
  training_metrics: TrainingMetrics | null;
  cross_generator_results: CrossGeneratorResult[];
  jpeg_robustness: Record<string, number>;
}

export interface ApiError {
  error: string;
  detail: string | null;
  code: string;
}

export interface ReportRequest {
  prediction: PredictionResult;
  original_image_base64: string;
  filename?: string | null;
  notes?: string | null;
  locale: "he" | "en";
}
```

---

## 6. API client

### `lib/api/client.ts`

```ts
import { env } from "@/lib/config/env";
import type { ApiError } from "./types";

export class ApiException extends Error {
  status: number;
  code: string;
  detail: string | null;
  constructor(message: string, status: number, code: string, detail: string | null) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

async function parseError(res: Response): Promise<never> {
  let body: ApiError | null = null;
  try { body = await res.json(); } catch { /* ignore */ }
  throw new ApiException(
    body?.error ?? `HTTP ${res.status}`,
    res.status,
    body?.code ?? "UNKNOWN",
    body?.detail ?? null,
  );
}

export interface RequestOptions extends RequestInit {
  /** Suppress global error toast (e.g. when the caller wants to handle it inline). */
  silent?: boolean;
  /** AbortSignal */
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  init: RequestOptions = {},
): Promise<T> {
  const url = `${env.NEXT_PUBLIC_API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) await parseError(res);
  // Endpoints returning binary (PDF) bypass this helper — see report.ts
  return res.json() as Promise<T>;
}

export async function apiRequestBlob(path: string, init: RequestOptions = {}): Promise<Blob> {
  const url = `${env.NEXT_PUBLIC_API_BASE_URL}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) await parseError(res);
  return res.blob();
}
```

### `lib/api/prediction.ts`

```ts
import { apiRequest } from "./client";
import type { PredictionResult, BatchPredictionResponse, PredictionRequestURL } from "./types";

export async function predictImage(
  file: File,
  options: { includeHeatmap?: boolean; signal?: AbortSignal } = {},
): Promise<PredictionResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("include_heatmap", String(options.includeHeatmap ?? true));
  return apiRequest<PredictionResult>("/api/predict", {
    method: "POST", body: fd, signal: options.signal,
  });
}

export async function predictFromUrl(
  payload: PredictionRequestURL,
  options: { signal?: AbortSignal } = {},
): Promise<PredictionResult> {
  return apiRequest<PredictionResult>("/api/predict/url", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: options.signal,
  });
}

export async function predictBatch(
  files: File[],
  options: { includeHeatmap?: boolean; signal?: AbortSignal } = {},
): Promise<BatchPredictionResponse> {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  fd.append("include_heatmap", String(options.includeHeatmap ?? false));
  return apiRequest<BatchPredictionResponse>("/api/predict/batch", {
    method: "POST", body: fd, signal: options.signal,
  });
}
```

### `lib/api/report.ts`

```ts
import { apiRequestBlob } from "./client";
import type { ReportRequest } from "./types";

export async function downloadReport(req: ReportRequest): Promise<Blob> {
  return apiRequestBlob("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}
```

### `lib/api/model.ts`

```ts
import { apiRequest } from "./client";
import type { ModelInfo } from "./types";

export async function getModelInfo(signal?: AbortSignal): Promise<ModelInfo> {
  return apiRequest<ModelInfo>("/api/model/info", { signal });
}
```

### `lib/api/health.ts`

```ts
import { apiRequest } from "./client";

export interface HealthResponse {
  status: "ok";
  model_loaded: boolean;
  version: string;
  uptime_s: number;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/health", { signal });
}
```

---

## 7. React Query hooks

All hooks are colocated under `lib/hooks/`. They are the **only** way components touch the API client — components never `import` from `lib/api/` directly.

### `lib/hooks/usePrediction.ts`

```ts
import { useMutation } from "@tanstack/react-query";
import { predictImage } from "@/lib/api/prediction";
import type { PredictionResult } from "@/lib/api/types";
import { toast } from "sonner";
import { ApiException } from "@/lib/api/client";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Vars { file: File; includeHeatmap?: boolean; }

export function usePrediction() {
  const { t } = useTranslation();
  return useMutation<PredictionResult, ApiException, Vars>({
    mutationFn: ({ file, includeHeatmap = true }) => predictImage(file, { includeHeatmap }),
    onError: (err) => {
      toast.error(t(`errors.${err.code}`, { fallback: err.message }));
    },
  });
}
```

### `lib/hooks/usePredictionFromUrl.ts`

```ts
import { useMutation } from "@tanstack/react-query";
import { predictFromUrl } from "@/lib/api/prediction";
import { ApiException } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PredictionResult, PredictionRequestURL } from "@/lib/api/types";

export function usePredictionFromUrl() {
  const { t } = useTranslation();
  return useMutation<PredictionResult, ApiException, PredictionRequestURL>({
    mutationFn: predictFromUrl,
    onError: (err) => toast.error(t(`errors.${err.code}`, { fallback: err.message })),
  });
}
```

### `lib/hooks/useBatchPrediction.ts`

```ts
import { useMutation } from "@tanstack/react-query";
import { predictBatch } from "@/lib/api/prediction";
import type { BatchPredictionResponse } from "@/lib/api/types";

interface Vars { files: File[]; includeHeatmap?: boolean; }

export function useBatchPrediction() {
  return useMutation<BatchPredictionResponse, Error, Vars>({
    mutationFn: ({ files, includeHeatmap = false }) =>
      predictBatch(files, { includeHeatmap }),
  });
}
```

### `lib/hooks/useReport.ts`

```ts
import { useMutation } from "@tanstack/react-query";
import { downloadReport } from "@/lib/api/report";
import { saveAs } from "file-saver";
import type { ReportRequest } from "@/lib/api/types";

export function useReport() {
  return useMutation({
    mutationFn: async (req: ReportRequest) => {
      const blob = await downloadReport(req);
      saveAs(blob, "realorfake-report.pdf");
      return blob;
    },
  });
}
```

### `lib/hooks/useModelInfo.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { getModelInfo } from "@/lib/api/model";

export function useModelInfo() {
  return useQuery({
    queryKey: ["model-info"],
    queryFn: ({ signal }) => getModelInfo(signal),
    staleTime: 5 * 60_000,
  });
}
```

### `lib/hooks/useHealth.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api/health";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: 30_000,
    retry: 1,
  });
}
```

### `lib/hooks/useImageDropzone.ts`

```ts
import { useDropzone, type FileRejection } from "react-dropzone";
import { useCallback } from "react";
import { env } from "@/lib/config/env";
import { toast } from "sonner";

interface Args {
  onAccept: (files: File[]) => void;
  multiple?: boolean;
}

export function useImageDropzone({ onAccept, multiple = false }: Args) {
  const onDrop = useCallback((accepted: File[], rejections: FileRejection[]) => {
    rejections.forEach(r => {
      const reason = r.errors[0]?.code;
      if (reason === "file-too-large") toast.error("הקובץ גדול מדי");
      else if (reason === "file-invalid-type") toast.error("פורמט לא נתמך");
      else toast.error(r.errors[0]?.message ?? "קובץ נדחה");
    });
    if (accepted.length > 0) onAccept(accepted);
  }, [onAccept]);

  return useDropzone({
    onDrop, multiple,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: env.NEXT_PUBLIC_MAX_UPLOAD_MB * 1024 * 1024,
  });
}
```

---

## 8. State management

State is kept lean. **Server state** (predictions, model info) lives entirely in React Query. **UI/session state** lives in a single Zustand store. Form-local state lives in React Hook Form.

### `lib/store/detection-store.ts`

```ts
import { create } from "zustand";
import type { PredictionResult, BatchPredictionResponse } from "@/lib/api/types";

export type Mode = "single" | "batch" | "url";
export type View = "original" | "heatmap" | "side-by-side";

interface DetectionStore {
  mode: Mode;
  view: View;
  showHeatmap: boolean;

  /** The image currently being analyzed (object URL, for preview). */
  previewUrl: string | null;
  /** Original file (single mode) — kept to allow re-submit or report generation. */
  currentFile: File | null;
  /** Original image base64 — populated when needed for PDF report submission. */
  currentImageBase64: string | null;

  result: PredictionResult | null;
  batchResult: BatchPredictionResponse | null;

  setMode: (m: Mode) => void;
  setView: (v: View) => void;
  setShowHeatmap: (v: boolean) => void;
  setPreview: (url: string | null, file: File | null) => void;
  setImageBase64: (b64: string | null) => void;
  setResult: (r: PredictionResult | null) => void;
  setBatchResult: (r: BatchPredictionResponse | null) => void;
  reset: () => void;
}

export const useDetectionStore = create<DetectionStore>((set, get) => ({
  mode: "single",
  view: "side-by-side",
  showHeatmap: true,
  previewUrl: null,
  currentFile: null,
  currentImageBase64: null,
  result: null,
  batchResult: null,

  setMode: (m) => set({ mode: m, result: null, batchResult: null }),
  setView: (v) => set({ view: v }),
  setShowHeatmap: (v) => set({ showHeatmap: v }),
  setPreview: (url, file) => {
    const prev = get().previewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({ previewUrl: url, currentFile: file });
  },
  setImageBase64: (b64) => set({ currentImageBase64: b64 }),
  setResult: (r) => set({ result: r }),
  setBatchResult: (r) => set({ batchResult: r }),
  reset: () => {
    const prev = get().previewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({
      previewUrl: null, currentFile: null, currentImageBase64: null,
      result: null, batchResult: null,
    });
  },
}));
```

---

## 9. Internationalization (Hebrew-first)

### `lib/i18n/dictionary.ts`

Strongly typed dictionary. Hebrew is the primary; English is a fallback. Strings are referenced by dotted keys.

```ts
export const dictionary = {
  he: {
    "app.name": "RealOrFake",
    "app.tagline": "גלאי תוכן שנוצר ע״י בינה מלאכותית",

    "nav.home": "בית",
    "nav.detect": "בדיקת תמונה",
    "nav.model": "המודל",
    "nav.about": "אודות",

    "landing.title": "אמיתי או מזויף?",
    "landing.subtitle": "העלה תמונה ונראה אם היא נוצרה ע״י AI",
    "landing.cta": "התחל לבדוק",

    "detect.upload.title": "גרור או בחר תמונה",
    "detect.upload.hint": "JPG, PNG או WebP, עד {{maxMb}} מ״ב",
    "detect.upload.or": "או",
    "detect.upload.url_placeholder": "הדבק קישור לתמונה",
    "detect.upload.url_submit": "בדוק",
    "detect.sample.title": "אין לך תמונה? נסה אחת מאלה:",

    "result.real": "אמיתי",
    "result.ai": "AI",
    "result.confidence": "ביטחון",
    "result.probabilities": "הסתברויות",
    "result.inference_time": "זמן עיבוד",
    "result.model": "מודל",
    "result.view.original": "מקור",
    "result.view.heatmap": "Heatmap",
    "result.view.both": "השוואה",
    "result.report.download": "הורד דוח PDF",
    "result.new": "תמונה חדשה",
    "result.explainer.title": "למה המודל החליט ככה?",
    "result.explainer.body": "האזורים האדומים/כתומים ב-heatmap הם המקומות שהמודל הסתמך עליהם בעת ההחלטה.",

    "batch.empty": "לא נבחרו קבצים",
    "batch.summary": "{{successful}} מתוך {{total}} הצליחו",

    "model.title": "המודל",
    "model.arch": "ארכיטקטורה",
    "model.params": "פרמטרים",
    "model.params.trainable": "ניתנים לאימון",
    "model.device": "התקן",
    "model.training.title": "תוצאות אימון",
    "model.accuracy": "דיוק",
    "model.auc": "AUC",
    "model.cm.title": "מטריצת בלבול (test set)",
    "model.cross.title": "ביצועים על מחוללים שלא נראו באימון",
    "model.jpeg.title": "עמידות לדחיסת JPEG",

    "common.loading": "טוען...",
    "common.error": "שגיאה",
    "common.retry": "נסה שוב",
    "common.copy": "העתק",
    "common.copied": "הועתק",

    "errors.INVALID_FILE": "הקובץ אינו תמונה תקפה",
    "errors.FILE_TOO_LARGE": "הקובץ גדול מדי",
    "errors.URL_FETCH_FAILED": "לא ניתן להוריד את התמונה מהקישור",
    "errors.INFERENCE_FAILED": "שגיאה בעת הניתוח. נסה שוב.",
    "errors.MODEL_NOT_LOADED": "המודל אינו זמין כרגע",
    "errors.UNKNOWN": "שגיאה לא צפויה",
  },
  en: {
    "app.name": "RealOrFake",
    "app.tagline": "AI-generated content detector",
    "nav.home": "Home",
    "nav.detect": "Detect",
    "nav.model": "Model",
    "nav.about": "About",
    "landing.title": "Real or fake?",
    "landing.subtitle": "Upload an image and we'll tell you if it was made by AI",
    "landing.cta": "Get started",
    "detect.upload.title": "Drop or pick an image",
    "detect.upload.hint": "JPG, PNG or WebP, up to {{maxMb}} MB",
    "detect.upload.or": "or",
    "detect.upload.url_placeholder": "Paste an image URL",
    "detect.upload.url_submit": "Analyze",
    "detect.sample.title": "No image? Try one of these:",
    "result.real": "Real",
    "result.ai": "AI",
    "result.confidence": "confidence",
    "result.probabilities": "Probabilities",
    "result.inference_time": "Inference time",
    "result.model": "Model",
    "result.view.original": "Original",
    "result.view.heatmap": "Heatmap",
    "result.view.both": "Side by side",
    "result.report.download": "Download PDF report",
    "result.new": "New image",
    "result.explainer.title": "Why did the model decide this?",
    "result.explainer.body": "Red/orange areas in the heatmap are the regions the model relied on most.",
    "batch.empty": "No files selected",
    "batch.summary": "{{successful}} of {{total}} succeeded",
    "model.title": "The model",
    "model.arch": "Architecture",
    "model.params": "Parameters",
    "model.params.trainable": "trainable",
    "model.device": "Device",
    "model.training.title": "Training results",
    "model.accuracy": "Accuracy",
    "model.auc": "AUC",
    "model.cm.title": "Confusion matrix (test set)",
    "model.cross.title": "Performance on unseen generators",
    "model.jpeg.title": "JPEG compression robustness",
    "common.loading": "Loading…",
    "common.error": "Error",
    "common.retry": "Retry",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "errors.INVALID_FILE": "The file isn't a valid image",
    "errors.FILE_TOO_LARGE": "File too large",
    "errors.URL_FETCH_FAILED": "Couldn't fetch the image from that URL",
    "errors.INFERENCE_FAILED": "Inference failed. Try again.",
    "errors.MODEL_NOT_LOADED": "The model isn't loaded right now",
    "errors.UNKNOWN": "Unexpected error",
  },
} as const;

export type Locale = keyof typeof dictionary;
export type TranslationKey = keyof (typeof dictionary)["he"];
```

### `lib/i18n/locale-context.tsx`

```tsx
"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Locale } from "./dictionary";
import { env } from "@/lib/config/env";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(env.NEXT_PUBLIC_DEFAULT_LOCALE);
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
```

### `lib/i18n/useTranslation.ts`

```ts
"use client";
import { useLocale } from "./locale-context";
import { dictionary, type TranslationKey } from "./dictionary";

export function useTranslation() {
  const { locale } = useLocale();
  const dict = dictionary[locale];

  function t(
    key: TranslationKey | string,
    vars?: Record<string, string | number> & { fallback?: string },
  ): string {
    const raw = (dict as Record<string, string>)[key] ?? vars?.fallback ?? key;
    if (!vars) return raw;
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
  }

  return { t, locale };
}
```

The root layout reads the locale from the provider and sets `<html lang dir>` accordingly. For RTL we use `dir="rtl"` when `locale === "he"`.

---

## 10. Styling

### `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        verdict: {
          real: "hsl(142 70% 38%)",
          ai: "hsl(355 78% 50%)",
        },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 280ms ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-rtl")],
};
export default config;
```

### `app/globals.css`

Set the CSS variables expected by shadcn (`--background`, `--foreground`, etc.). Use a light palette by default; include a `.dark` class with dark palette. Logical properties (`ps-`, `pe-`, `start-`, `end-`) are favored over `pl-`/`pr-` so styles flip cleanly under RTL.

### Color palette decisions

- **Primary brand:** `hsl(220 47% 27%)` (deep navy — matches the proposal accent)
- **Real:** green `hsl(142 70% 38%)`
- **AI-generated:** red `hsl(355 78% 50%)`
- **Surfaces:** neutral grays from Tailwind defaults via shadcn vars

### Fonts

Use `next/font/google` to load **Heebo** (Hebrew + Latin):

```ts
// app/layout.tsx (excerpt)
import { Heebo } from "next/font/google";
const heebo = Heebo({ subsets: ["latin", "hebrew"], variable: "--font-heebo" });
```

---

## 11. Root layout

### `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

const heebo = Heebo({ subsets: ["latin", "hebrew"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "RealOrFake — גלאי תוכן AI",
  description: "כלי לזיהוי תמונות שנוצרו ע״י בינה מלאכותית",
  openGraph: { title: "RealOrFake", description: "AI image detector" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // dir is set client-side by LocaleProvider via a small useEffect that mutates documentElement.
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <Header />
          <main className="container mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
          <Footer />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
```

### `app/providers.tsx`

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";

function HtmlDirSync() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
  }, [locale]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
  }));
  return (
    <LocaleProvider>
      <HtmlDirSync />
      <QueryClientProvider client={qc}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </LocaleProvider>
  );
}
```

---

## 12. Pages

### `app/page.tsx` — Landing (`/`)

- Hero: title (`landing.title`), subtitle (`landing.subtitle`), CTA button linking to `/detect`.
- Three feature cards below the fold (icon + title + 1-line description):
  1. "מבוסס Transfer Learning" (icon: `Brain`)
  2. "Heatmap מסביר את ההחלטה" (icon: `Eye`)
  3. "פתוח, ללא תשלום וללא הרשמה" (icon: `LockOpen`)
- A muted-tone band that shows two side-by-side preview images (real + AI) with labels (decorative; clicking either jumps to `/detect` with the sample preloaded).

Implementation rule: this page is a server component. The CTA `<Link>` is enough; no client interactivity beyond that.

### `app/detect/page.tsx` — Detector (`/detect`)

- Pure shell. Imports and renders `<DetectorPanel />` (client component).

### `app/model/page.tsx` — Model info (`/model`)

- Pure shell rendering `<ModelInfoCard />`, `<ConfusionMatrixView />`, `<CrossGeneratorChart />`, `<JpegRobustnessChart />`.
- Uses `useModelInfo()` once; passes data down.
- Shows skeletons while loading.

### `app/about/page.tsx`

Static MDX-like content (just JSX): the project's purpose, who built it (Adir Shlomov), the course, and a link to GitHub. Includes a paragraph noting the connection to Felora and the motivation for the project.

### `app/error.tsx`

A minimal error boundary using the `ErrorMessage` component. Includes a "retry" button that calls `reset()`.

### `app/not-found.tsx`

Friendly 404 with a link back to `/`.

---

## 13. Components — detailed specs

For each component: file path, props, behavior, and key implementation notes. Components are TypeScript-first; props are exported interfaces.

### `components/detector/DetectorPanel.tsx`

**Purpose:** the top-level page composition for `/detect`. Orchestrates mode selection, dispatch to the right input (single drop zone, batch zone, URL), and renders results.

```tsx
"use client";
export function DetectorPanel() { /* ... */ }
```

**Behavior:**
1. Reads `mode` from the Zustand store.
2. Tabs (shadcn `<Tabs>`) for: single | batch | URL (in Hebrew: יחיד / מרובה / קישור).
3. Inside each tab the appropriate sub-component:
   - Single → `<DropZone multiple={false}>` + on result, `<ResultCard>` and `<HeatmapView>`.
   - Batch → `<DropZone multiple>` + `<BatchList>`.
   - URL → `<URLInput>` + on result, the same single-result UI.
4. Below the upload area when no result yet: `<SampleGallery>` (preloads sample image into the single-mode flow).
5. Smooth transitions between empty/result states using `animate-slide-up`.

### `components/detector/DropZone.tsx`

```tsx
interface DropZoneProps {
  multiple?: boolean;
  onAccepted: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}
```

**Behavior:**
- Wraps `useImageDropzone`.
- Renders a dashed-border zone with a centered icon (`UploadCloud`) + title + hint.
- On hover/drag-active: glow border (Tailwind `ring-2 ring-primary`).
- Mobile: bottom button "צילום מהמצלמה" using `<input type="file" accept="image/*" capture="environment">` — wired through `react-dropzone` `inputProps`.
- Disabled state: muted styling, no pointer events.

### `components/detector/URLInput.tsx`

```tsx
interface URLInputProps {
  onAccepted: (url: string) => void;
  disabled?: boolean;
}
```

**Behavior:**
- React Hook Form + Zod (`z.string().url()`).
- On submit, calls `onAccepted(url)`.
- Inline error message under the input on invalid URL.
- Submit button uses `<Button type="submit">` from shadcn.

### `components/detector/SampleGallery.tsx`

**Behavior:**
- Renders a grid of 4 sample thumbnails (2 real, 2 AI), pulled from `/public/samples/`.
- Each tile has a label badge ("Real" / "AI-generated") — but the badge is **hidden until** the prediction returns. The user sees just the image initially; the truth label appears after detection so they can compare.
- Clicking a tile: fetches the local file as a `Blob` → wraps in `File` → calls the same `usePrediction` mutation as the drop zone.

### `components/detector/ResultCard.tsx`

```tsx
interface ResultCardProps {
  result: PredictionResult;
  filename?: string;
  onReset: () => void;
  onDownloadReport: () => void;
}
```

**Behavior:**
- Big colored badge: green "אמיתי" or red "AI" (uses `verdict.real` / `verdict.ai` colors).
- Large confidence number formatted as `97.3%` via `formatPercent()`.
- Sub-row: model_arch · input_size · inference_ms ms.
- Two-column probability table (`<ProbabilityTable>`).
- Two CTAs:
  - Primary: `result.report.download` → calls `onDownloadReport`.
  - Secondary: `result.new` → calls `onReset`.

### `components/detector/ConfidenceBar.tsx`

```tsx
interface ConfidenceBarProps {
  value: number;            // 0..1
  label?: string;
  variant: "real" | "ai";
  showPercentage?: boolean;
}
```

**Behavior:**
- Wrapper around shadcn `<Progress>`, but with a colored bar matching `variant`.
- Animates from 0 to value on mount (300ms ease-out).
- Optional percentage label on the right (logical end).

### `components/detector/ProbabilityTable.tsx`

```tsx
interface ProbabilityTableProps {
  probabilities: Record<"real" | "ai_generated", number>;
}
```

**Behavior:**
- Two rows, each: class label · numeric percentage · mini `<ConfidenceBar>`.
- The class whose probability is higher is bolded.

### `components/detector/HeatmapToggle.tsx`

```tsx
interface HeatmapToggleProps {
  view: View;
  onChange: (v: View) => void;
}
```

**Behavior:**
- Three-segment radio group (shadcn `<Tabs>` styled as a segmented control): Original | Heatmap | Side-by-side.
- Persists choice in the Zustand store (`setView`).

### `components/detector/HeatmapView.tsx`

```tsx
interface HeatmapViewProps {
  previewUrl: string;       // object URL of original
  heatmapBase64: string | null;
  view: View;
}
```

**Behavior:**
- `view === "original"`: render only the original image.
- `view === "heatmap"`: render only the Grad-CAM overlay (decoded from base64 to `data:image/png;base64,...`).
- `view === "side-by-side"`: two images side by side with captions ("מקור" / "Heatmap").
- All images use `next/image` with `unoptimized` (since they're blobs/data URIs) and `width`/`height` defaulting to `512`.
- Aspect ratio preserved; container max-width is `lg:max-w-2xl`.

### `components/detector/BatchList.tsx`

```tsx
interface BatchListProps {
  response: BatchPredictionResponse;
}
```

**Behavior:**
- Header row: `batch.summary` with substitution.
- For each result, a `<BatchItemRow>`.
- For each error, a destructive-variant `<BatchItemRow>` with the error message.

### `components/detector/BatchItemRow.tsx`

```tsx
interface BatchItemRowProps {
  filename: string;
  label?: "real" | "ai_generated";
  confidence?: number;
  errorCode?: string;
  thumbnailUrl?: string;
}
```

**Behavior:**
- Card with thumbnail, filename, verdict badge, and confidence percentage.
- For errors: red border, error message instead of verdict.

### `components/detector/ReportButton.tsx`

```tsx
interface ReportButtonProps {
  prediction: PredictionResult;
  originalImageBase64: string;
  filename?: string;
}
```

**Behavior:**
- Wraps `useReport()` mutation.
- Disabled while loading; shows spinner inside button.
- On click: opens a small `<Dialog>` for optional notes (textarea, max 2000 chars), then triggers download.

### `components/detector/EmptyState.tsx`

Used when no image has been chosen yet. Just an SVG illustration + a short prompt and the upload button.

### `components/detector/DetectorSkeleton.tsx`

Shown while a prediction is in flight. Skeleton for the image area + skeleton for the result card. Uses shadcn `<Skeleton>`.

### `components/detector/ExplainerCallout.tsx`

A muted-tone informational card explaining what the heatmap means. Shown collapsed by default; expandable.

### `components/model/ModelInfoCard.tsx`

```tsx
interface ModelInfoCardProps {
  info: ModelInfo;
}
```

**Behavior:**
- Renders arch, input_size, parameters (humanized with M/K suffix), device, checkpoint time.
- If `training_metrics` present: shows accuracy + AUC big numbers.

### `components/model/ConfusionMatrixView.tsx`

```tsx
interface ConfusionMatrixViewProps {
  matrix: ConfusionMatrix;
}
```

**Behavior:**
- 2×2 grid rendered as a styled HTML table with row/column headers ("Predicted" × "Actual" — uses logical properties).
- Heatmap-style background: each cell tinted by its proportion of row total.
- Total row + column tallies on the edges.

### `components/model/CrossGeneratorChart.tsx`

```tsx
interface CrossGeneratorChartProps {
  results: CrossGeneratorResult[];
}
```

**Behavior:**
- Horizontal bar chart via `recharts`, grouped: accuracy bar for each generator.
- Hover tooltip shows `n_samples`.

### `components/model/JpegRobustnessChart.tsx`

```tsx
interface JpegRobustnessChartProps {
  data: Record<string, number>;  // e.g. {"Q90":0.92,"Q70":0.88,"Q50":0.81,"Q30":0.70}
}
```

**Behavior:**
- Line chart, x = JPEG quality (parsed from key), y = accuracy.

### `components/layout/Header.tsx`

- Sticky top, blurred background (`backdrop-blur`), border-bottom.
- Brand wordmark "RealOrFake" linking to `/`.
- `<Nav>` in the middle with links to detect / model / about.
- `<LocaleSwitcher>` on the end side.

### `components/layout/Nav.tsx`

- Uses `usePathname()` to highlight active link.
- On mobile: collapses to a `<DropdownMenu>` (shadcn).

### `components/layout/LocaleSwitcher.tsx`

- A small `<DropdownMenu>` with `עב` / `EN`.
- Persists choice to `localStorage` and updates the locale context.

### `components/layout/Footer.tsx`

- Single line: project name, year, link to GitHub, course name.
- Centered, muted.

### `components/shared/LoadingSpinner.tsx`

`<Loader2 className="animate-spin">` from `lucide-react`. Accepts a `size` prop (`sm` | `md` | `lg`).

### `components/shared/ErrorMessage.tsx`

```tsx
interface ErrorMessageProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}
```

Card with an `AlertTriangle` icon, message, and optional retry button.

### `components/shared/CopyableHash.tsx`

Renders a long string truncated to ~12 chars with an end-side copy button. Uses `useCopyToClipboard`.

### `components/shared/ExternalLink.tsx`

`<a target="_blank" rel="noreferrer noopener">` wrapper that adds an `ExternalLink` icon (lucide) at the logical end.

---

## 14. Detector flow (single mode) — step by step

This is the canonical path through the app. Implement it exactly.

1. User lands on `/detect`. `<DetectorPanel>` mounts in `single` mode.
2. `<DropZone>` is visible alongside `<SampleGallery>` and `<URLInput>`.
3. User drops a file (or clicks a sample, or pastes a URL).
4. `setPreview(URL.createObjectURL(file), file)` is called → image preview shows.
5. The file's base64 is computed (`lib/utils/image.ts → fileToBase64`) and stored via `setImageBase64`.
6. `usePrediction.mutate({ file, includeHeatmap: true })` fires.
7. While loading: `<DetectorSkeleton>` replaces the result area.
8. On success: `setResult(result)` is stored, `<ResultCard>` + `<HeatmapView>` render.
9. The Grad-CAM heatmap is decoded by prefixing `data:image/png;base64,` to `result.heatmap_base64`.
10. User can flip between Original / Heatmap / Side-by-side via `<HeatmapToggle>`.
11. User can click "הורד דוח" → `<ReportButton>` opens a notes dialog → on confirm, `useReport.mutate({...})` triggers PDF download.
12. User can click "תמונה חדשה" → `reset()` clears everything; the dropzone reappears.

For URL mode the flow is identical except step 4 — instead of `URL.createObjectURL`, the preview source is the URL itself (with a CORS-safe fallback to fetching it client-side and converting to blob).

For batch mode: step 6 calls `useBatchPrediction` instead, and step 8 renders `<BatchList>` instead of a single result.

---

## 15. Utilities

### `lib/utils/cn.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

### `lib/utils/format.ts`

```ts
export function formatPercent(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatNumberShort(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatDateTime(iso: string, locale = "he-IL"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
```

### `lib/utils/image.ts`

```ts
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string; // "data:image/jpeg;base64,..."
      resolve(result.split(",")[1] ?? "");
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function base64ToDataUrl(b64: string, mime = "image/png"): string {
  return `data:${mime};base64,${b64}`;
}

export async function urlToFile(url: string, filename = "image.jpg"): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
```

### `lib/utils/file-validation.ts`

```ts
import { env } from "@/lib/config/env";

export interface ValidationResult { ok: boolean; reason?: string; }

export function validateImageFile(file: File): ValidationResult {
  if (!env.ALLOWED_MIME_SET.has(file.type)) {
    return { ok: false, reason: "פורמט לא נתמך" };
  }
  if (file.size > env.NEXT_PUBLIC_MAX_UPLOAD_MB * 1024 * 1024) {
    return { ok: false, reason: `הקובץ גדול מ-${env.NEXT_PUBLIC_MAX_UPLOAD_MB} מ״ב` };
  }
  return { ok: true };
}
```

---

## 16. Public samples

`public/samples/` ships with 4 images:

- `real_01.jpg` — a real photo (CC0 licensed; cite source in `public/samples/README.md`)
- `real_02.jpg` — another CC0 photo, different subject
- `fake_01.jpg` — an image generated through Felora (or a CIFAKE test sample)
- `fake_02.jpg` — generated via DALL-E (or a different generator)

Each must be ≤ 500 KB, 1024 px on the long edge. Provenance is documented in `public/samples/README.md`.

---

## 17. Tests

### `vitest.config.ts`

Standard Vitest + JSDOM + React plugin configuration. Sets up `tests/setup.ts` which:

- Extends `expect` with `@testing-library/jest-dom` matchers.
- Starts the MSW server (`tests/mocks/server.ts`) before all tests, resets handlers after each, closes after all.

### `tests/mocks/handlers.ts`

```ts
import { http, HttpResponse } from "msw";
import { fixturePrediction } from "./fixtures";

const base = "http://localhost:8000";

export const handlers = [
  http.get(`${base}/health`, () => HttpResponse.json({ status: "ok", model_loaded: true, version: "0.1.0", uptime_s: 10 })),
  http.post(`${base}/api/predict`, async () => HttpResponse.json(fixturePrediction("ai_generated", 0.97))),
  http.post(`${base}/api/predict/url`, async () => HttpResponse.json(fixturePrediction("real", 0.88))),
  http.post(`${base}/api/predict/batch`, async () => HttpResponse.json({
    results: [fixturePrediction("real", 0.91), fixturePrediction("ai_generated", 0.83)],
    errors: [], total: 2, successful: 2, failed: 0, total_inference_ms: 220,
  })),
];
```

### Required test cases

- `ResultCard.test.tsx`:
  - Renders "אמיתי" badge and green color when label === "real".
  - Renders "AI" badge and red color when label === "ai_generated".
  - Renders confidence as percentage with one decimal.
  - Clicking "תמונה חדשה" calls `onReset`.
- `ConfidenceBar.test.tsx`:
  - Width animates to `value * 100` (test by inspecting `style` after a tick).
  - Variant prop applies the correct color class.
- `DropZone.test.tsx`:
  - Calls `onAccepted` when a valid image is dropped.
  - Shows a toast and does NOT call `onAccepted` when a `.txt` is dropped.
- `usePrediction.test.ts`:
  - Returns the mocked PredictionResult on success.
  - Surfaces an `ApiException` with code on 4xx response.
- `useBatchPrediction.test.ts`:
  - Returns a batch response with two items.
- `file-validation.test.ts`:
  - Rejects unsupported MIME.
  - Rejects oversized file.
  - Accepts a valid JPEG under the limit.
- `image.test.ts`:
  - `fileToBase64` returns a base64 string of the file's content.
  - `base64ToDataUrl` returns a properly-prefixed data URI.

CI target: `pnpm test --coverage` with ≥ 70% coverage on `components/detector/` and `lib/hooks/`.

---

## 18. Build & deploy

### `package.json` (scripts)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write ."
  }
}
```

### `next.config.mjs`

```js
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: { typedRoutes: true },
};
export default nextConfig;
```

### Vercel

- Add the project, set `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL.
- Production branch: `main`. Preview deploys on PRs.
- No middleware, no edge functions — all rendering is SSG/Client.

---

## 19. README content (for the repo)

The generated `README.md` must include:

1. Title + one-line description.
2. Live demo URL + screenshot.
3. Quickstart (`pnpm install`, `cp .env.local.example .env.local`, `pnpm dev`).
4. Environment variables table.
5. Architecture diagram (in plain ASCII or a linked SVG): browser ↔ Next.js ↔ FastAPI ↔ PyTorch.
6. Scripts table.
7. Tests section.
8. Course-requirements mapping (copy from §1 of this doc).
9. License: MIT.

---

## 20. Accessibility

- All interactive elements reachable via keyboard. Drop zone activatable with Enter/Space.
- Buttons have explicit `aria-label` when only an icon is shown.
- Color is never the sole carrier of meaning — the verdict has both color and text ("אמיתי" / "AI").
- Focus rings visible (Tailwind `focus-visible:ring-2 ring-primary`).
- `dir="rtl"` on the root for Hebrew; logical Tailwind utilities (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) used throughout so the layout flips correctly under LTR English.
- Color contrast ≥ 4.5:1 for body text against backgrounds.

---

## 21. Acceptance criteria (definition of done)

- [ ] `pnpm dev` boots the app at `localhost:3000` with no console errors.
- [ ] Landing page renders in Hebrew with RTL layout by default.
- [ ] Switching locale to English flips the layout to LTR without a page reload.
- [ ] `/detect` accepts a JPG drop and renders `<ResultCard>` + `<HeatmapView>` within ~2s on local backend.
- [ ] The Grad-CAM heatmap renders as a PNG overlay; `view === "side-by-side"` shows two images.
- [ ] Pasting an invalid URL shows an inline validation error; pasting a valid URL kicks off a prediction.
- [ ] Dropping 5 images in batch mode renders one row per image plus a summary line.
- [ ] Mixed batch (4 valid + 1 corrupt) shows 4 success rows + 1 error row.
- [ ] "הורד דוח PDF" downloads a PDF file via the browser.
- [ ] `/model` shows accuracy, AUC, parameter counts, confusion matrix, cross-generator chart, and JPEG-robustness chart when backend metrics are available.
- [ ] Backend down → toast appears with `errors.UNKNOWN` or `MODEL_NOT_LOADED`; UI doesn't crash.
- [ ] `pnpm typecheck` passes with zero errors.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes the cases in §17.
- [ ] Vercel preview deploy works end-to-end against a deployed Render backend.

---

## 22. Notes for the implementer

- **Do not** call the API from React components directly. Components → hook → API client. Always.
- **Do not** use `useState` for server state. That is `useQuery`/`useMutation`'s job.
- **All image base64** strings from the backend come without the `data:` prefix. Prepend `data:image/png;base64,` when assigning to `<img src>`.
- **Object URLs leak** if not revoked. The Zustand store revokes the previous URL when `setPreview` is called and on `reset()`.
- **`useDetectionStore` is for UI state, not for caching predictions.** Don't put React Query responses there permanently; only the `currentResult` of the active session.
- **RTL gotchas:** test every component twice — once in `dir="rtl"`, once in `dir="ltr"`. Anything using literal `left-`, `right-`, `ml-`, `mr-`, etc. must be replaced with logical equivalents (`start-`, `end-`, `ms-`, `me-`).
- **`next/image` and base64:** use `unoptimized` for `data:` URIs, or use a plain `<img>` for those. Object URLs (`blob:`) work fine with `next/image` if you pass `unoptimized`.
- **Concurrent prediction requests:** if the user drops a new file mid-request, cancel the old request via the `AbortController` passed through `useMutation`'s `onMutate` (Query v5 doesn't pass `signal` to mutations by default — use an explicit `AbortController` ref).
- **Avoid Server Components for the detector flow.** It's client-heavy (state, blobs, mutations). Server components are fine for `/`, `/about`, and shells of `/detect` and `/model`.

---

## 23. Out of scope (do not build)

- Authentication.
- Persistence of past detections (no DB).
- Real-time camera streaming / live detection.
- Video frame extraction (stretch goal in the proposal — leave for later).
- Multi-tenant or shared sessions.
- Native mobile apps. The web app is mobile-responsive and that's enough.
- Server-side localization routing (`/he`, `/en` paths). The runtime switcher is enough for the demo.

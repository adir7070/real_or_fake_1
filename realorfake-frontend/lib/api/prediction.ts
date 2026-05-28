import { apiRequest } from "./client";
import type { PredictionResult, BatchPredictionResponse, PredictionRequestURL } from "./types";

export async function predictImage(
  file: File,
  options: { includeHeatmap?: boolean; signal?: AbortSignal } = {}
): Promise<PredictionResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("include_heatmap", String(options.includeHeatmap ?? true));
  return apiRequest<PredictionResult>("/api/predict", {
    method: "POST",
    body: fd,
    signal: options.signal,
  });
}

export async function predictFromUrl(
  payload: PredictionRequestURL,
  options: { signal?: AbortSignal } = {}
): Promise<PredictionResult> {
  return apiRequest<PredictionResult>("/api/predict/url", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: options.signal,
  });
}

export async function predictBatch(
  files: File[],
  options: { includeHeatmap?: boolean; signal?: AbortSignal } = {}
): Promise<BatchPredictionResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  fd.append("include_heatmap", String(options.includeHeatmap ?? false));
  return apiRequest<BatchPredictionResponse>("/api/predict/batch", {
    method: "POST",
    body: fd,
    signal: options.signal,
  });
}

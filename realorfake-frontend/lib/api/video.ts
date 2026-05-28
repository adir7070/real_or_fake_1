import { apiRequest } from "./client";
import type { VideoPredictionResult } from "./types";

export async function predictVideo(
  file: File,
  options: { signal?: AbortSignal } = {}
): Promise<VideoPredictionResult> {
  const fd = new FormData();
  fd.append("file", file);
  return apiRequest<VideoPredictionResult>("/api/predict/video", {
    method: "POST",
    body: fd,
    signal: options.signal,
  });
}

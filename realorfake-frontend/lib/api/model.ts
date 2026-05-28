import { apiRequest } from "./client";
import type { ModelInfo } from "./types";

export async function getModelInfo(signal?: AbortSignal): Promise<ModelInfo> {
  return apiRequest<ModelInfo>("/api/model/info", { signal });
}

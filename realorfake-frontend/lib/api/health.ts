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

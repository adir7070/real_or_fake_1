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
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  throw new ApiException(
    body?.error ?? `HTTP ${res.status}`,
    res.status,
    body?.code ?? "UNKNOWN",
    body?.detail ?? null
  );
}

export interface RequestOptions extends RequestInit {
  /** Suppress global error toast (e.g. when the caller wants to handle it inline). */
  silent?: boolean;
  /** AbortSignal */
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, init: RequestOptions = {}): Promise<T> {
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

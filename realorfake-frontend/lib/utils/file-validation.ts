import { env } from "@/lib/config/env";

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!env.ALLOWED_MIME_SET.has(file.type)) {
    return { ok: false, reason: "פורמט לא נתמך" };
  }
  if (file.size > env.NEXT_PUBLIC_MAX_UPLOAD_MB * 1024 * 1024) {
    return { ok: false, reason: `הקובץ גדול מ-${env.NEXT_PUBLIC_MAX_UPLOAD_MB} מ״ב` };
  }
  return { ok: true };
}

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
  ALLOWED_MIME_SET: new Set(parsed.data.NEXT_PUBLIC_ALLOWED_MIME.split(",").map((s) => s.trim())),
};

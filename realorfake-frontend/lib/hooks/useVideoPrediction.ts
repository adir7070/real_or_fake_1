"use client";
import { useMutation } from "@tanstack/react-query";
import { predictVideo } from "@/lib/api/video";
import { ApiException } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { VideoPredictionResult } from "@/lib/api/types";

interface Vars {
  file: File;
  signal?: AbortSignal;
}

export function useVideoPrediction() {
  const { t } = useTranslation();
  return useMutation<VideoPredictionResult, ApiException, Vars>({
    mutationFn: ({ file, signal }) => predictVideo(file, { signal }),
    onError: (err) => toast.error(t(`errors.${err.code}`, { fallback: err.message })),
  });
}

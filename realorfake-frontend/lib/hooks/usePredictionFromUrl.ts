"use client";
import { useMutation } from "@tanstack/react-query";
import { predictFromUrl } from "@/lib/api/prediction";
import { ApiException } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PredictionResult, PredictionRequestURL } from "@/lib/api/types";

export function usePredictionFromUrl() {
  const { t } = useTranslation();
  return useMutation<PredictionResult, ApiException, PredictionRequestURL>({
    mutationFn: (payload: PredictionRequestURL) => predictFromUrl(payload),
    onError: (err) => toast.error(t(`errors.${err.code}`, { fallback: err.message })),
  });
}

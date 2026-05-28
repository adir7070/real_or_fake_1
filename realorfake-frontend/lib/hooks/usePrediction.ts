"use client";
import { useMutation } from "@tanstack/react-query";
import { predictImage } from "@/lib/api/prediction";
import type { PredictionResult } from "@/lib/api/types";
import { toast } from "sonner";
import { ApiException } from "@/lib/api/client";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Vars {
  file: File;
  includeHeatmap?: boolean;
}

export function usePrediction() {
  const { t } = useTranslation();
  return useMutation<PredictionResult, ApiException, Vars>({
    mutationFn: ({ file, includeHeatmap = true }) => predictImage(file, { includeHeatmap }),
    onError: (err) => {
      toast.error(t(`errors.${err.code}`, { fallback: err.message }));
    },
  });
}

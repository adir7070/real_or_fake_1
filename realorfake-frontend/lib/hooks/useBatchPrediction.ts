"use client";
import { useMutation } from "@tanstack/react-query";
import { predictBatch } from "@/lib/api/prediction";
import type { BatchPredictionResponse } from "@/lib/api/types";

interface Vars {
  files: File[];
  includeHeatmap?: boolean;
}

export function useBatchPrediction() {
  return useMutation<BatchPredictionResponse, Error, Vars>({
    mutationFn: ({ files, includeHeatmap = false }) => predictBatch(files, { includeHeatmap }),
  });
}

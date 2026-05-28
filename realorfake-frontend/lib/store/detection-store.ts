import { create } from "zustand";
import type { PredictionResult, BatchPredictionResponse, VideoPredictionResult } from "@/lib/api/types";

export type Mode = "single" | "batch" | "url" | "video";
export type View = "original" | "heatmap" | "side-by-side";

interface DetectionStore {
  mode: Mode;
  view: View;
  showHeatmap: boolean;

  /** The image currently being analyzed (object URL, for preview). */
  previewUrl: string | null;
  /** Original file (single mode) — kept to allow re-submit or report generation. */
  currentFile: File | null;
  /** Original image base64 — populated when needed for PDF report submission. */
  currentImageBase64: string | null;

  result: PredictionResult | null;
  batchResult: BatchPredictionResponse | null;
  videoResult: VideoPredictionResult | null;

  setMode: (m: Mode) => void;
  setView: (v: View) => void;
  setShowHeatmap: (v: boolean) => void;
  setPreview: (url: string | null, file: File | null) => void;
  setImageBase64: (b64: string | null) => void;
  setResult: (r: PredictionResult | null) => void;
  setBatchResult: (r: BatchPredictionResponse | null) => void;
  setVideoResult: (r: VideoPredictionResult | null) => void;
  reset: () => void;
}

export const useDetectionStore = create<DetectionStore>((set, get) => ({
  mode: "single",
  view: "side-by-side",
  showHeatmap: true,
  previewUrl: null,
  currentFile: null,
  currentImageBase64: null,
  result: null,
  batchResult: null,
  videoResult: null,

  setMode: (m) => set({ mode: m, result: null, batchResult: null, videoResult: null }),
  setView: (v) => set({ view: v }),
  setShowHeatmap: (v) => set({ showHeatmap: v }),
  setPreview: (url, file) => {
    const prev = get().previewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({ previewUrl: url, currentFile: file });
  },
  setImageBase64: (b64) => set({ currentImageBase64: b64 }),
  setResult: (r) => set({ result: r }),
  setBatchResult: (r) => set({ batchResult: r }),
  setVideoResult: (r) => set({ videoResult: r }),
  reset: () => {
    const prev = get().previewUrl;
    if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    set({
      previewUrl: null,
      currentFile: null,
      currentImageBase64: null,
      result: null,
      batchResult: null,
      videoResult: null,
    });
  },
}));

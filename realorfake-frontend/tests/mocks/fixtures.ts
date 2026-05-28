import type { PredictionResult } from "@/lib/api/types";

export function fixturePrediction(
  label: "real" | "ai_generated",
  confidence: number
): PredictionResult {
  return {
    label,
    confidence,
    probabilities: {
      real: label === "real" ? confidence : 1 - confidence,
      ai_generated: label === "ai_generated" ? confidence : 1 - confidence,
    },
    heatmap_base64: null,
    heatmap_raw_base64: null,
    model_arch: "vit_b_16",
    inference_ms: 250,
    input_size: 224,
    timestamp: new Date().toISOString(),
  };
}

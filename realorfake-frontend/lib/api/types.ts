export type Label = "real" | "ai_generated";

export interface PredictionResult {
  label: Label;
  confidence: number; // 0..1
  probabilities: Record<Label, number>;
  heatmap_base64: string | null; // PNG without data: prefix
  heatmap_raw_base64: string | null;
  model_arch: string;
  inference_ms: number;
  input_size: number;
  timestamp: string; // ISO-8601
}

export interface PredictionRequestURL {
  url: string;
  include_heatmap: boolean;
}

export interface BatchItemError {
  index: number;
  filename: string | null;
  error: string;
  code: string;
}

export interface BatchPredictionResponse {
  results: PredictionResult[];
  errors: BatchItemError[];
  total: number;
  successful: number;
  failed: number;
  total_inference_ms: number;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}
export interface ClassMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}
export interface TrainingMetrics {
  accuracy: number;
  auc: number;
  confusion_matrix: ConfusionMatrix;
  per_class: Record<"real" | "ai_generated", ClassMetrics>;
}
export interface CrossGeneratorResult {
  generator_name: string;
  accuracy: number;
  auc: number;
  n_samples: number;
}
export interface ModelInfo {
  arch: string;
  input_size: number;
  parameters_total: number;
  parameters_trainable: number;
  device: string;
  checkpoint_loaded_at: string;
  training_metrics: TrainingMetrics | null;
  cross_generator_results: CrossGeneratorResult[];
  jpeg_robustness: Record<string, number>;
}

export interface FrameResult {
  frame_index: number;
  timestamp_s: number;
  label: Label;
  confidence: number;
  probabilities: Record<Label, number>;
}

export interface VideoPredictionResult {
  label: Label;
  confidence: number;
  probabilities: Record<Label, number>;
  frames_analyzed: number;
  duration_s: number;
  frame_results: FrameResult[];
  model_arch: string;
  inference_ms: number;
  timestamp: string;
}

export interface ApiError {
  error: string;
  detail: string | null;
  code: string;
}

export interface ReportRequest {
  prediction: PredictionResult;
  original_image_base64: string;
  filename?: string | null;
  notes?: string | null;
  locale: "he" | "en";
}

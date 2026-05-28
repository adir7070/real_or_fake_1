import { http, HttpResponse } from "msw";
import { fixturePrediction } from "./fixtures";

const base = "http://localhost:8000";

export const handlers = [
  http.get(`${base}/health`, () =>
    HttpResponse.json({
      status: "ok",
      model_loaded: true,
      version: "0.1.0",
      uptime_s: 10,
    })
  ),
  http.post(`${base}/api/predict`, async () =>
    HttpResponse.json(fixturePrediction("ai_generated", 0.97))
  ),
  http.post(`${base}/api/predict/url`, async () =>
    HttpResponse.json(fixturePrediction("real", 0.88))
  ),
  http.post(`${base}/api/predict/batch`, async () =>
    HttpResponse.json({
      results: [
        fixturePrediction("real", 0.91),
        fixturePrediction("ai_generated", 0.83),
      ],
      errors: [],
      total: 2,
      successful: 2,
      failed: 0,
      total_inference_ms: 220,
    })
  ),
];

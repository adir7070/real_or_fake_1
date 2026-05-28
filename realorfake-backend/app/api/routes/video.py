from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import get_prediction_service
from app.api.errors import FileTooLargeError, InvalidFileError
from app.schemas.video import FrameResult, VideoPredictionResult
from app.services.prediction_service import PredictionService
from app.services.video_service import VideoService

router = APIRouter(prefix="/predict", tags=["predict"])

_video_service = VideoService()

ALLOWED_VIDEO_MIME = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
    "video/avi",
}
MAX_VIDEO_MB = 100


@router.post("/video", response_model=VideoPredictionResult)
async def predict_video(
    file: UploadFile = File(...),
    service: PredictionService = Depends(get_prediction_service),
) -> VideoPredictionResult:
    contents = await file.read()

    if len(contents) > MAX_VIDEO_MB * 1024 * 1024:
        raise FileTooLargeError(f"הקובץ גדול מדי — מקסימום {MAX_VIDEO_MB} MB")

    content_type = file.content_type or ""
    if not any(content_type.startswith(m.split("/")[0] + "/") for m in ALLOWED_VIDEO_MIME) or content_type not in ALLOWED_VIDEO_MIME:
        raise InvalidFileError(f"סוג קובץ לא נתמך: {content_type}")

    t0 = time.perf_counter()
    frames, duration = _video_service.extract_frames(contents)

    frame_results: list[FrameResult] = []
    label_votes: dict[str, int] = {}
    prob_sums: dict[str, float] = {}

    for frame_idx, timestamp, img in frames:
        out = service.engine.predict(img, include_heatmap=False)
        lbl: str = out["label"]
        label_votes[lbl] = label_votes.get(lbl, 0) + 1
        for k, v in out["probabilities"].items():
            prob_sums[k] = prob_sums.get(k, 0.0) + v
        frame_results.append(
            FrameResult(
                frame_index=frame_idx,
                timestamp_s=timestamp,
                label=lbl,
                confidence=out["confidence"],
                probabilities=out["probabilities"],
            )
        )

    n = len(frame_results) or 1
    avg_probs = {k: round(v / n, 4) for k, v in prob_sums.items()}
    overall_label = max(label_votes, key=lambda k: label_votes[k]) if label_votes else "real"
    overall_confidence = avg_probs.get(overall_label, 0.0)

    return VideoPredictionResult(
        label=overall_label,
        confidence=overall_confidence,
        probabilities=avg_probs,
        frames_analyzed=len(frame_results),
        duration_s=duration,
        frame_results=frame_results,
        model_arch=service.engine.arch,
        inference_ms=round((time.perf_counter() - t0) * 1000, 1),
        timestamp=datetime.now(timezone.utc),
    )

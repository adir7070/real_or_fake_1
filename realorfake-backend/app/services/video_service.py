from __future__ import annotations

import os
import tempfile

import cv2
from PIL import Image

from app.api.errors import InvalidFileError

MAX_FRAMES = 16


class VideoService:
    def extract_frames(
        self,
        video_bytes: bytes,
        n_frames: int = MAX_FRAMES,
    ) -> tuple[list[tuple[int, float, Image.Image]], float]:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(video_bytes)
            tmp_path = f.name

        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise InvalidFileError("לא ניתן לפתוח את קובץ הווידאו")

            total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            duration = total / fps if total > 0 else 0.0

            if total == 0:
                raise InvalidFileError("קובץ הווידאו ריק")

            n = min(n_frames, total)
            indices = [int(i * total / n) for i in range(n)]

            frames: list[tuple[int, float, Image.Image]] = []
            for idx in indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append((idx, round(idx / fps, 2), Image.fromarray(rgb)))

            return frames, round(duration, 2)
        finally:
            cap.release()
            os.unlink(tmp_path)

import base64
import io

import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from app.ml.transforms import build_eval_transform


class GradCAMService:
    def __init__(
        self,
        model: torch.nn.Module,
        arch: str,
        device: torch.device,
        input_size: int = 224,
    ) -> None:
        self.model = model
        self.device = device
        self.input_size = input_size
        self.transform = build_eval_transform(input_size)

        target_layers = model.gradcam_target_layers  # type: ignore[attr-defined]
        reshape = None
        if arch == "vit_b_16":
            from app.ml.models.vit import ViTClassifier

            reshape = ViTClassifier.vit_reshape_transform

        self.cam = GradCAM(
            model=model, target_layers=target_layers, reshape_transform=reshape
        )

    def compute(self, img: Image.Image, target_class: int) -> tuple[str, str]:
        """Returns (overlay_png_base64, raw_heatmap_png_base64)."""
        rgb_for_overlay = self._resize_for_overlay(img)
        input_tensor = self.transform(img).unsqueeze(0).to(self.device)

        grayscale_cam = self.cam(
            input_tensor=input_tensor,
            targets=[ClassifierOutputTarget(target_class)],
        )[0]

        overlay = show_cam_on_image(rgb_for_overlay, grayscale_cam, use_rgb=True)
        raw_heatmap = cv2.applyColorMap(
            (grayscale_cam * 255).astype(np.uint8), cv2.COLORMAP_JET
        )
        raw_heatmap = cv2.cvtColor(raw_heatmap, cv2.COLOR_BGR2RGB)

        return self._encode_png(overlay), self._encode_png(raw_heatmap)

    def _resize_for_overlay(self, img: Image.Image) -> np.ndarray:
        from torchvision.transforms.functional import center_crop, resize

        sized = resize(img, int(self.input_size * 1.15))
        cropped = center_crop(sized, self.input_size)
        arr = np.asarray(cropped.convert("RGB"), dtype=np.float32) / 255.0
        return arr

    @staticmethod
    def _encode_png(arr_uint8: np.ndarray) -> str:
        img = Image.fromarray(arr_uint8)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii")

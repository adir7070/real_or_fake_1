import base64
from datetime import datetime
from io import BytesIO

import qrcode
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from app.schemas.report import ReportRequest


class ReportService:
    def __init__(self, public_app_url: str) -> None:
        self.public_app_url = public_app_url

    def build_pdf(self, payload: ReportRequest) -> bytes:
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        W, H = A4

        # Header
        c.setFillColor(colors.HexColor("#1F3A68"))
        c.setFont("Helvetica-Bold", 24)
        c.drawString(2 * cm, H - 2.5 * cm, "RealOrFake - Detection Report")
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)
        c.drawString(
            2 * cm, H - 3.1 * cm, f"Generated: {datetime.utcnow().isoformat()}Z"
        )

        # Verdict + confidence
        c.setFont("Helvetica-Bold", 18)
        label_color = (
            "#C81E1E" if payload.prediction.label == "ai_generated" else "#1F7A3A"
        )
        c.setFillColor(colors.HexColor(label_color))
        c.drawString(
            2 * cm,
            H - 4.5 * cm,
            f"Verdict: {payload.prediction.label.upper()}  "
            f"({payload.prediction.confidence * 100:.1f}% confidence)",
        )
        c.setFillColor(colors.black)

        # Original image
        orig = self._decode_b64(payload.original_image_base64)
        self._draw_image(
            c, orig, x=2 * cm, y=H - 13 * cm, max_w=8 * cm, max_h=8 * cm,
            caption="Original",
        )

        # Heatmap
        if payload.prediction.heatmap_base64:
            heat = self._decode_b64(payload.prediction.heatmap_base64)
            self._draw_image(
                c, heat, x=11 * cm, y=H - 13 * cm, max_w=8 * cm, max_h=8 * cm,
                caption="Grad-CAM overlay",
            )

        # Probabilities
        y = H - 15 * cm
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2 * cm, y, "Probabilities")
        c.setFont("Helvetica", 11)
        for i, (k, v) in enumerate(payload.prediction.probabilities.items()):
            c.drawString(2 * cm, y - (i + 1) * 0.55 * cm, f"  {k}:  {v * 100:.2f}%")

        # Model info
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2 * cm, H - 18 * cm, "Model")
        c.setFont("Helvetica", 10)
        c.drawString(
            2 * cm,
            H - 18.6 * cm,
            f"Architecture: {payload.prediction.model_arch}    "
            f"Input size: {payload.prediction.input_size}px    "
            f"Inference: {payload.prediction.inference_ms} ms",
        )

        # Notes
        if payload.notes:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(2 * cm, H - 20 * cm, "Notes")
            text = c.beginText(2 * cm, H - 20.6 * cm)
            text.setFont("Helvetica", 10)
            for line in payload.notes.splitlines():
                text.textLine(line[:110])
            c.drawText(text)

        # QR code
        qr_img = qrcode.make(self.public_app_url)
        qr_bytes = BytesIO()
        qr_img.save(qr_bytes, format="PNG")
        qr_bytes.seek(0)
        from reportlab.lib.utils import ImageReader

        c.drawImage(
            ImageReader(qr_bytes),
            W - 4.5 * cm,
            2 * cm,
            width=2.5 * cm,
            height=2.5 * cm,
            mask="auto",
        )
        c.setFont("Helvetica", 8)
        c.drawString(W - 4.5 * cm, 1.7 * cm, "Try it: realorfake.app")

        c.showPage()
        c.save()
        return buf.getvalue()

    def _decode_b64(self, b64: str) -> Image.Image:
        return Image.open(BytesIO(base64.b64decode(b64))).convert("RGB")

    def _draw_image(
        self,
        c: canvas.Canvas,
        img: Image.Image,
        x: float,
        y: float,
        max_w: float,
        max_h: float,
        caption: str,
    ) -> None:
        from reportlab.lib.utils import ImageReader

        w, h = img.size
        ratio = min(max_w / w, max_h / h)
        new_w, new_h = w * ratio, h * ratio
        buf = BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        c.drawImage(
            ImageReader(buf), x, y, width=new_w, height=new_h, mask="auto"
        )
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(x, y - 0.5 * cm, caption)

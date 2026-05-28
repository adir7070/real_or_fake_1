import io
import random

from PIL import Image


class JPEGCompressionAugmentation:
    """
    Randomly re-encode the PIL image as JPEG at varying qualities.
    Crucial for robustness to social-network compression.
    """

    def __init__(
        self,
        probabilities: tuple = (0.0, 0.4, 0.6),
        qualities: tuple = (95, 70, 40),
    ) -> None:
        assert len(probabilities) == len(qualities)
        assert abs(sum(probabilities) - 1.0) < 1e-6
        self.probabilities = probabilities
        self.qualities = qualities

    def __call__(self, img: Image.Image) -> Image.Image:
        q = random.choices(self.qualities, weights=self.probabilities, k=1)[0]
        if q >= 95:
            return img
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=int(q))
        buf.seek(0)
        return Image.open(buf).convert("RGB")

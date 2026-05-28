from PIL import Image

from app.api.errors import FileTooLargeError, InvalidFileError
from app.services.image_service import ImageService
import pytest
import io


def _jpeg_bytes_of(color=(100, 150, 100)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color=color).save(buf, format="JPEG")
    return buf.getvalue()


def test_valid_jpeg_returns_pil():
    img = ImageService.validate_and_open(_jpeg_bytes_of(), "image/jpeg")
    assert isinstance(img, Image.Image)


def test_invalid_mime_raises():
    with pytest.raises(InvalidFileError) as exc:
        ImageService.validate_and_open(_jpeg_bytes_of(), "text/plain")
    assert exc.value.code == "INVALID_FILE"


def test_non_image_bytes_raises():
    with pytest.raises(InvalidFileError):
        ImageService.validate_and_open(b"garbage data xyz", "image/jpeg")


def test_oversized_raises():
    big = b"x" * (11 * 1024 * 1024)
    with pytest.raises(FileTooLargeError) as exc:
        ImageService.validate_and_open(big, "image/jpeg")
    assert exc.value.code == "FILE_TOO_LARGE"

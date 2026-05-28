from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.api.errors import FileTooLargeError, InvalidFileError
from app.config import settings


class ImageService:
    @staticmethod
    def validate_and_open(
        contents: bytes, content_type: str | None
    ) -> Image.Image:
        if content_type and content_type not in settings.allowed_mime_types_set:
            raise InvalidFileError(
                f"Unsupported MIME type: {content_type}",
                detail=f"Allowed: {sorted(settings.allowed_mime_types_set)}",
            )
        if len(contents) > settings.max_upload_mb * 1024 * 1024:
            raise FileTooLargeError(f"File exceeds {settings.max_upload_mb} MB")
        try:
            img = Image.open(BytesIO(contents))
            img.verify()
            return Image.open(BytesIO(contents)).convert("RGB")
        except (UnidentifiedImageError, OSError) as e:
            raise InvalidFileError("Image could not be decoded", detail=str(e)) from e

from fastapi import Request
from fastapi.responses import JSONResponse
from app.schemas.common import ErrorResponse


class AppError(Exception):
    code: str = "APP_ERROR"
    status_code: int = 500
    detail: str | None = None

    def __init__(self, message: str, detail: str | None = None):
        super().__init__(message)
        self.message = message
        self.detail = detail


class InvalidFileError(AppError):
    code = "INVALID_FILE"
    status_code = 400


class FileTooLargeError(AppError):
    code = "FILE_TOO_LARGE"
    status_code = 413


class URLFetchError(AppError):
    code = "URL_FETCH_FAILED"
    status_code = 400


class InferenceError(AppError):
    code = "INFERENCE_FAILED"
    status_code = 500


class ModelNotLoadedError(AppError):
    code = "MODEL_NOT_LOADED"
    status_code = 503


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.message, detail=exc.detail, code=exc.code
        ).model_dump(),
    )

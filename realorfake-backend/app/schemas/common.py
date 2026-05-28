from pydantic import BaseModel
from typing import Generic, TypeVar
from datetime import datetime

T = TypeVar("T")


class Timestamped(BaseModel):
    timestamp: datetime


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
    code: str

import time
import logging
from functools import wraps
from typing import Callable, Any

logger = logging.getLogger(__name__)


class Timer:
    """Context manager for measuring elapsed time in milliseconds."""

    def __init__(self, name: str = "") -> None:
        self.name = name
        self.elapsed_ms: int = 0
        self._start: float = 0.0

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_: Any) -> None:
        self.elapsed_ms = int((time.perf_counter() - self._start) * 1000)
        if self.name:
            logger.debug("%s took %d ms", self.name, self.elapsed_ms)


def timed(func: Callable) -> Callable:
    """Decorator that logs execution time of the wrapped function."""

    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        with Timer(func.__qualname__) as t:
            result = func(*args, **kwargs)
        logger.debug("%s elapsed %d ms", func.__qualname__, t.elapsed_ms)
        return result

    return wrapper

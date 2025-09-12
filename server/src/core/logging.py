import logging
import os
from .config import settings


def setup_logging(level: str | int | None = None) -> None:
    """Configure application-wide logging one time.

    Order of precedence for level:
    1) explicit level param
    2) env LOG_LEVEL
    3) settings.DEBUG -> DEBUG else INFO
    """
    if getattr(setup_logging, "_configured", False):
        return

    if isinstance(level, str):
        resolved_level = getattr(logging, level.upper(), logging.INFO)
    elif isinstance(level, int):
        resolved_level = level
    else:
        env_level = os.getenv("LOG_LEVEL")
        if env_level:
            resolved_level = getattr(logging, env_level.upper(), logging.INFO)
        else:
            resolved_level = logging.DEBUG if settings.DEBUG else logging.INFO

    logging.basicConfig(
        level=resolved_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    # Make sure uvicorn loggers use our level
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(name)
        logger.setLevel(resolved_level)

    setup_logging._configured = True  # type: ignore[attr-defined]



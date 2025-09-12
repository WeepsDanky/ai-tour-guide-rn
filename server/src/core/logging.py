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

    # Suppress noisy debug logs from SDKs even in DEBUG mode
    # Especially remove messages like "DEBUG [openai._base_client] Request options: ..."
    noisy_loggers = {
        "openai": logging.INFO,
        "openai._base_client": logging.INFO,
        "httpx": logging.INFO,
        "httpcore": logging.INFO,
        "any_llm": logging.INFO,
    }
    for name, lvl in noisy_loggers.items():
        logging.getLogger(name).setLevel(lvl)

    setup_logging._configured = True  # type: ignore[attr-defined]



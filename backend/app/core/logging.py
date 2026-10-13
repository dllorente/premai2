import logging
import logging.handlers
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parents[3] / "logs"
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"


def setup_logging(level: int = logging.INFO) -> None:
    LOG_DIR.mkdir(exist_ok=True)

    handler_file = logging.handlers.TimedRotatingFileHandler(
        filename=LOG_DIR / "premai2.log",
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
    )
    handler_file.suffix = "%Y-%m-%d"
    handler_file.setFormatter(logging.Formatter(LOG_FORMAT))

    handler_console = logging.StreamHandler()
    handler_console.setFormatter(logging.Formatter(LOG_FORMAT))

    logging.basicConfig(level=level, handlers=[handler_file, handler_console])

    # silence noisy libs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

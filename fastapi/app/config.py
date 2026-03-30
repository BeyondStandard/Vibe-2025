import os
import pathlib
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    database_url: str
    upload_dir: pathlib.Path


@lru_cache
def get_settings() -> Settings:
    return Settings(
        database_url=os.getenv("DATABASE_URL", "sqlite:///./data/app.db"),
        upload_dir=pathlib.Path(os.getenv("UPLOAD_DIR", "data/uploads")),
    )

"""ASGI entrypoint for `uvicorn main:app` when cwd is `fastapi/`."""

from app.main import app

__all__ = ["app"]

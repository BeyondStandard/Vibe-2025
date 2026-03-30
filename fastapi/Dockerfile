# Build from repository root:
#   docker build -f fastapi/Dockerfile -t vibe-2025 .
FROM python:3.13-slim

RUN pip install --no-cache-dir uv

WORKDIR /repo
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-group dev

COPY fastapi /repo/fastapi

WORKDIR /repo/fastapi
ENV PATH="/repo/.venv/bin:$PATH"
ENV PYTHONPATH=/repo/fastapi

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

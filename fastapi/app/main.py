import pathlib
from contextlib import asynccontextmanager

import dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import ensure_upload_root, init_db
from app.routers import api_routes, legacy_mcqs


@asynccontextmanager
async def lifespan(_app: FastAPI):
    dotenv.load_dotenv()
    data_dir = pathlib.Path(get_settings().upload_dir).resolve().parent
    data_dir.mkdir(parents=True, exist_ok=True)
    ensure_upload_root()
    init_db()
    yield


app = FastAPI(title="Vibe-2025 MCQ Generator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(legacy_mcqs.router)
app.include_router(api_routes.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "mcq-generator"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

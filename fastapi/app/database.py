from __future__ import annotations

import pathlib
from collections.abc import Generator
from datetime import UTC, datetime

from sqlalchemy import ForeignKey, String, create_engine, func, select
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(default=1)
    name: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(String(4096), default="")
    subject: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    documents: Mapped[list[Document]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    learning_session_id: Mapped[int] = mapped_column(ForeignKey("learning_sessions.id"))
    subject: Mapped[str] = mapped_column(String(64))
    original_filename: Mapped[str] = mapped_column(String(512))
    file_type: Mapped[str] = mapped_column(String(128))
    file_size: Mapped[int] = mapped_column(default=0)
    stored_path: Mapped[str] = mapped_column(String(1024))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    session: Mapped[LearningSession] = relationship(back_populates="documents")


engine = None
SessionLocal: sessionmaker | None = None


def init_db(database_url: str | None = None) -> None:
    global engine, SessionLocal
    url = database_url or get_settings().database_url
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator:
    if SessionLocal is None:
        init_db()
    assert SessionLocal is not None
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_upload_root() -> pathlib.Path:
    root = get_settings().upload_dir.resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def session_document_counts(db) -> dict[int, int]:
    stmt = select(Document.learning_session_id, func.count(Document.id)).group_by(
        Document.learning_session_id
    )
    rows = db.execute(stmt).all()
    return {int(r[0]): int(r[1]) for r in rows}

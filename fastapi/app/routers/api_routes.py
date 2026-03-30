from __future__ import annotations

import pathlib

import pydantic
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import (
    Document,
    LearningSession,
    ensure_upload_root,
    get_db,
    session_document_counts,
)
from app.mcq_core import (
    clamp_max_questions,
    generate_mcqs_from_merged_text,
    pdf_text_from_bytes,
)

router = APIRouter(prefix="/api", tags=["api"])

VALID_SUBJECTS = frozenset({"MATH", "MEDICINE", "COMPUTER_SCIENCE"})


class SessionMCQBody(pydantic.BaseModel):
    maxQuestionsPerDocument: int = pydantic.Field(default=5, ge=1, le=10)


def _session_out(s: LearningSession, document_count: int = 0) -> dict:
    return {
        "id": s.id,
        "user_id": s.user_id,
        "name": s.name,
        "description": s.description,
        "subject": s.subject,
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat(),
        "document_count": document_count,
    }


def _document_out(d: Document) -> dict:
    return {
        "id": d.id,
        "user_id": 1,
        "subject": d.subject,
        "file_type": d.file_type,
        "file_key": d.stored_path,
        "original_filename": d.original_filename,
        "file_size": d.file_size,
        "created_at": d.created_at.isoformat(),
        "updated_at": d.updated_at.isoformat(),
    }


def _upload_root() -> pathlib.Path:
    return ensure_upload_root()


def _delete_stored_file(upload_root: pathlib.Path, stored_path: str) -> None:
    p = upload_root / stored_path
    if p.is_file():
        p.unlink()


@router.post("/learning-sessions")
async def create_learning_session(
    name: str = Form(...),
    description: str = Form(""),
    subject: str = Form(...),
    documents: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
):
    if subject not in VALID_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    ls = LearningSession(
        user_id=1,
        name=name,
        description=description or "",
        subject=subject,
    )
    db.add(ls)
    db.flush()

    upload_root = _upload_root()
    out_docs: list[dict] = []
    for uf in documents or []:
        raw = await uf.read()
        suffix = pathlib.Path(uf.filename or "file").suffix or ".pdf"
        doc = Document(
            learning_session_id=ls.id,
            subject=subject,
            original_filename=uf.filename or f"file{suffix}",
            file_type=uf.content_type or "application/pdf",
            file_size=len(raw),
            stored_path="",
        )
        db.add(doc)
        db.flush()
        rel = f"{ls.id}/{doc.id}{suffix}"
        dest = upload_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        doc.stored_path = rel
        out_docs.append(_document_out(doc))

    db.commit()
    db.refresh(ls)
    return {
        "success": True,
        "session": _session_out(ls, document_count=len(out_docs)),
        "documents": out_docs,
    }


@router.get("/learning-sessions")
def list_learning_sessions(
    subject: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(LearningSession).order_by(LearningSession.id.desc())
    if subject:
        if subject not in VALID_SUBJECTS:
            raise HTTPException(status_code=400, detail="Invalid subject")
        stmt = stmt.where(LearningSession.subject == subject)
    rows = db.scalars(stmt).all()
    counts = session_document_counts(db)
    sessions = [_session_out(s, counts.get(s.id, 0)) for s in rows]
    return {"success": True, "data": {"sessions": sessions}}


@router.get("/learning-sessions/{session_id}")
def get_learning_session(session_id: int, db: Session = Depends(get_db)):
    ls = db.get(LearningSession, session_id)
    if not ls:
        raise HTTPException(status_code=404, detail="Session not found")
    docs = db.scalars(
        select(Document).where(Document.learning_session_id == session_id)
    ).all()
    return {
        "success": True,
        "data": {
            "session": _session_out(ls, document_count=len(docs)),
            "documents": [_document_out(d) for d in docs],
        },
    }


@router.delete("/learning-sessions/{session_id}")
def delete_learning_session(session_id: int, db: Session = Depends(get_db)):
    ls = db.get(LearningSession, session_id)
    if not ls:
        raise HTTPException(status_code=404, detail="Session not found")
    upload_root = _upload_root()
    for d in ls.documents:
        _delete_stored_file(upload_root, d.stored_path)
    db.delete(ls)
    db.commit()
    return {"success": True}


@router.post("/learning-sessions/{session_id}/mcqs")
def generate_session_mcqs(
    session_id: int,
    body: SessionMCQBody,
    db: Session = Depends(get_db),
):
    ls = db.get(LearningSession, session_id)
    if not ls:
        raise HTTPException(status_code=404, detail="Session not found")
    docs = db.scalars(
        select(Document).where(Document.learning_session_id == session_id)
    ).all()
    if not docs:
        return {
            "success": False,
            "questions": [],
            "totalQuestions": 0,
            "sessionId": session_id,
            "error": "No documents in this session",
        }

    upload_root = _upload_root()
    parts: list[str] = []
    for d in docs:
        path = upload_root / d.stored_path
        if not path.is_file():
            continue
        raw = path.read_bytes()
        text = pdf_text_from_bytes(raw)
        parts.append(f"### File: {d.original_filename}\n{text}")

    merged = "\n\n".join(parts).strip()
    if not merged:
        return {
            "success": False,
            "questions": [],
            "totalQuestions": 0,
            "sessionId": session_id,
            "error": "No extractable text from session documents",
        }

    mq = clamp_max_questions(body.maxQuestionsPerDocument)
    try:
        out = generate_mcqs_from_merged_text(merged, mq)
    except Exception as e:
        return {
            "success": False,
            "questions": [],
            "totalQuestions": 0,
            "sessionId": session_id,
            "error": str(e),
        }

    questions = [
        {
            "question": it.question,
            "options": list(it.options),
            "correct_index": it.correct_index,
            "explanation": it.explanation,
        }
        for it in out.items
    ]
    return {
        "success": True,
        "questions": questions,
        "totalQuestions": len(questions),
        "sessionId": session_id,
    }


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    subject: str = Form(...),
    learning_session_id: str = Form(...),
    db: Session = Depends(get_db),
):
    if subject not in VALID_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    try:
        sid = int(learning_session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid learning_session_id")
    ls = db.get(LearningSession, sid)
    if not ls:
        raise HTTPException(status_code=404, detail="Session not found")
    if ls.subject != subject:
        raise HTTPException(status_code=400, detail="Subject does not match session")

    raw = await file.read()
    suffix = pathlib.Path(file.filename or "file").suffix or ".pdf"
    doc = Document(
        learning_session_id=sid,
        subject=subject,
        original_filename=file.filename or f"file{suffix}",
        file_type=file.content_type or "application/pdf",
        file_size=len(raw),
        stored_path="",
    )
    db.add(doc)
    db.flush()
    rel = f"{sid}/{doc.id}{suffix}"
    dest = _upload_root() / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(raw)
    doc.stored_path = rel
    db.commit()
    db.refresh(doc)
    return {"success": True, "data": {"document": _document_out(doc)}}


@router.get("/documents/session/{learning_session_id}")
def documents_for_session(learning_session_id: str, db: Session = Depends(get_db)):
    try:
        sid = int(learning_session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid learning_session_id")
    ls = db.get(LearningSession, sid)
    if not ls:
        raise HTTPException(status_code=404, detail="Session not found")
    docs = db.scalars(select(Document).where(Document.learning_session_id == sid)).all()
    return {
        "success": True,
        "data": {"documents": [_document_out(d) for d in docs]},
    }


@router.delete("/documents/{document_id}")
def delete_document_row(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    _delete_stored_file(_upload_root(), doc.stored_path)
    db.delete(doc)
    db.commit()
    return {"success": True}

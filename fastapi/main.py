from langchain_openai import ChatOpenAI
from langsmith import Client, traceable
from langsmith.schemas import Attachment

import pydantic
import pathlib
import fastapi
import typing
import dotenv
import pypdf
import io
import os


# noinspection PyTypeHints
class MCQItem(pydantic.BaseModel):
    question: str
    options: pydantic.conlist(str, min_length=4, max_length=4)
    correct_index: pydantic.conint(ge=0, le=3)
    explanation: str


# noinspection PyTypeHints
class Output(pydantic.BaseModel):
    items: pydantic.conlist(MCQItem, min_length=1, max_length=10)


PDF_PATH = pathlib.Path("data/heart.pdf")


def _read_file_bytes(file_path: pathlib.Path) -> bytes:
    with open(file_path, "rb") as f:
        return f.read()


def _pdf_text_from_bytes(pdf_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    texts: list[str] = []
    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""
        texts.append(page_text)
    return "\n\n".join(texts).strip()


@traceable(dangerously_allow_filesystem=True)
def generate_mcqs_from_pdf(pdf: Attachment, max_questions: int = 10) -> Output:
    pdf_data: bytes
    data: typing.Any = getattr(pdf, "data", None)
    if isinstance(data, (bytes, bytearray)):
        pdf_data = bytes(data)
    elif isinstance(data, (str, pathlib.Path)):
        pdf_data = _read_file_bytes(pathlib.Path(data))
    else:
        raise TypeError("Unsupported pdf attachment data; expected bytes or file path")

    document_text = _pdf_text_from_bytes(pdf_data)
    if not document_text:
        document_text = "[PDF text could not be extracted or is empty.]"

    client = Client(
        api_url=os.getenv("LANGSMITH_ENDPOINT"), api_key=os.getenv("LANGSMITH_API_KEY")
    )
    prompt_runnable = client.pull_prompt("vibe-2025")

    base_model = ChatOpenAI()
    model = base_model.with_structured_output(Output, method="function_calling")

    chain = prompt_runnable | model
    result: Output = chain.invoke(
        {
            "document": document_text,
            "context": document_text,
            "text": document_text,
            "content": document_text,
            "max_questions": max_questions,
        }
    )
    return result


app = fastapi.FastAPI(title="Vibe-2025 MCQ Generator")


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "mcq-generator"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/mcqs", response_model=Output)
def mcqs(max_questions: int = 10) -> Output:
    dotenv.load_dotenv()
    pdf_attachment = Attachment(
        mime_type="application/pdf", data=_read_file_bytes(PDF_PATH)
    )
    return generate_mcqs_from_pdf(pdf_attachment, max_questions=max_questions)

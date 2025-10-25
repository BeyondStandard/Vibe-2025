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
import boto3
from botocore.exceptions import BotoCoreError, ClientError


# noinspection PyTypeHints
class MCQItem(pydantic.BaseModel):
    question: str
    options: pydantic.conlist(str, min_length=4, max_length=4)
    correct_index: pydantic.conint(ge=0, le=3)
    explanation: str


# noinspection PyTypeHints
class Output(pydantic.BaseModel):
    items: pydantic.conlist(MCQItem, min_length=1, max_length=10)


class MCQRequest(pydantic.BaseModel):
    s3_uri: str
    max_questions: int = 10


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


def _parse_s3_uri(s3_uri: str) -> tuple[str, str]:
    if not s3_uri.startswith("s3://"):
        raise ValueError("Invalid S3 URI; must start with s3://")
    remainder = s3_uri[5:]
    if "/" not in remainder:
        raise ValueError("Invalid S3 URI; missing key path")
    bucket, key = remainder.split("/", 1)
    if not bucket or not key:
        raise ValueError("Invalid S3 URI; bucket or key missing")
    return bucket, key


def _read_s3_file_bytes(s3_uri: str) -> bytes:
    bucket, key = _parse_s3_uri(s3_uri)
    session = boto3.session.Session(
        region_name=os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    )
    s3 = session.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )
    try:
        resp = s3.get_object(Bucket=bucket, Key=key)
        return resp["Body"].read()
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"Failed to read S3 object s3://{bucket}/{key}: {e}")


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


@app.post("/mcqs", response_model=Output)
def mcqs(body: MCQRequest) -> Output:
    dotenv.load_dotenv()
    pdf_bytes = _read_s3_file_bytes(body.s3_uri)
    pdf_attachment = Attachment(mime_type="application/pdf", data=pdf_bytes)
    return generate_mcqs_from_pdf(pdf_attachment, max_questions=body.max_questions)

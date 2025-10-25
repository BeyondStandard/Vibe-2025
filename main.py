from langsmith.schemas import Attachment
from langchain_openai import ChatOpenAI
from langsmith import traceable, Client

import pydantic
import pathlib
import dotenv
import typing
import pypdf
import json
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


PDF_PATH = pathlib.Path(
    "/home/mantas/Documents/Personal/Vibe-2025/data/medicine_slides/heart.pdf"
)


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
def generate_mcqs_from_pdf(pdf: Attachment, max_questions: int = 10) -> str:
    """Generate multiple-choice questions from a PDF using a LangSmith prompt.

    The PDF is passed as a LangSmith Attachment for rich tracing.
    """
    # Resolve bytes from the attachment (supports byte data or filesystem path via traceable flag)
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

    # Pull prompt from LangSmith
    client = Client(
        api_url=os.getenv("LANGSMITH_ENDPOINT"), api_key=os.getenv("LANGSMITH_API_KEY")
    )
    prompt_runnable = client.pull_prompt("vibe-2025")

    # Define structured output schema

    # Use base model and request structured output
    base_model = ChatOpenAI()
    model = base_model.with_structured_output(Output, method="function_calling")

    chain = prompt_runnable | model
    # We provide common variable names; extra keys are ignored by prompts
    result: Output = chain.invoke(
        {
            "document": document_text,
            "context": document_text,
            "text": document_text,
            "content": document_text,
            "max_questions": max_questions,
        }
    )
    return json.dumps(result.model_dump(), ensure_ascii=False, indent=2)


def main() -> None:
    dotenv.load_dotenv()
    pdf_attachment = Attachment(
        mime_type="application/pdf", data=_read_file_bytes(PDF_PATH)
    )

    answer = generate_mcqs_from_pdf(pdf=pdf_attachment, max_questions=10)
    print("\n=== Answer ===\n")
    print(answer)


if __name__ == "__main__":
    main()

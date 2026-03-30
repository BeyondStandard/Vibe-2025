import fastapi
from langsmith.schemas import Attachment

from app.mcq_core import MCQRequest, Output, generate_mcqs_from_pdf, read_s3_file_bytes

router = fastapi.APIRouter(tags=["legacy"])


@router.post("/mcqs", response_model=Output)
def mcqs(body: MCQRequest) -> Output:
    pdf_bytes = read_s3_file_bytes(body.s3_uri)
    pdf_attachment = Attachment(mime_type="application/pdf", data=pdf_bytes)
    return generate_mcqs_from_pdf(pdf_attachment, max_questions=body.max_questions)

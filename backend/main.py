from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import uuid

from rag.ingest import ingest_pdf
from rag.ask import answer_question

app = FastAPI(title="RAG Personal Knowledge Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class AskRequest(BaseModel):
    question: str
    document_ids: list[str] | None = None
    chat_history: list[dict] | None = None


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    doc_id = str(uuid.uuid4())

    file_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"

    content = await file.read()

    file_path.write_bytes(content)

    result = ingest_pdf(
        str(file_path),
        doc_id=doc_id,
        filename=file.filename
    )

    return {
        "message": "Uploaded successfully",
        "document_id": doc_id,
        "chunks_indexed": result["chunks_indexed"]
    }


@app.post("/ask")
async def ask(req: AskRequest):

    response = answer_question(
        question=req.question,
        document_ids=req.document_ids,
        chat_history=req.chat_history or [],
    )

    return response
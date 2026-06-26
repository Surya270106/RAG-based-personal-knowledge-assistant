import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
import fitz

MODEL_NAME = "all-MiniLM-L6-v2"

model = SentenceTransformer(MODEL_NAME)

INDEX_PATH = Path("vectorstore/faiss.index")
META_PATH = Path("vectorstore/meta.json")

INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 150
):
    chunks = []

    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        chunk = text[start:end]

        chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def load_index(dim: int):
    if INDEX_PATH.exists():
        return faiss.read_index(str(INDEX_PATH))

    return faiss.IndexFlatL2(dim)


def ingest_pdf(
    pdf_path: str,
    doc_id: str,
    filename: str
):
    doc = fitz.open(pdf_path)

    all_chunks = []
    metadata = []

    for page_num, page in enumerate(doc, start=1):

        text = page.get_text()

        if not text:
            continue

        text = text.strip()

        if len(text) < 20:
            continue

        chunks = chunk_text(text)

        for i, chunk in enumerate(chunks):

            cleaned = chunk.strip()

            if len(cleaned) < 20:
                continue

            all_chunks.append(cleaned)

            metadata.append({
                "doc_id": doc_id,
                "filename": filename,
                "page": page_num,
                "chunk_index": i,
                "text": cleaned
            })

    print("TOTAL CHUNKS:", len(all_chunks))

    if len(all_chunks) == 0:
        raise ValueError(
            "No readable text found in PDF."
        )

    embeddings = model.encode(
        all_chunks,
        normalize_embeddings=True
    )

    embeddings = np.array(
        embeddings
    ).astype("float32")

    index = load_index(
        embeddings.shape[1]
    )

    index.add(embeddings)

    faiss.write_index(
        index,
        str(INDEX_PATH)
    )

    existing_meta = []

    if META_PATH.exists():
        existing_meta = json.loads(
            META_PATH.read_text()
        )

    existing_meta.extend(metadata)

    META_PATH.write_text(
        json.dumps(existing_meta, indent=2)
    )

    return {
        "chunks_indexed": len(all_chunks)
    }
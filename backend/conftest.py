import pytest
import tempfile
import json
import shutil
from pathlib import Path
from unittest.mock import MagicMock, patch

import fitz  # PyMuPDF
import numpy as np


@pytest.fixture
def sample_text():
    """A block of text long enough to produce multiple chunks."""
    return (
        "Retrieval-Augmented Generation (RAG) is a technique that combines "
        "information retrieval with language model generation. It works by first "
        "retrieving relevant documents from a knowledge base, then using those "
        "documents as context for the language model to generate accurate answers. "
        "This approach significantly reduces hallucinations and grounds the model's "
        "responses in factual, verifiable information. RAG pipelines typically "
        "involve an embedding model to convert text into vectors, a vector database "
        "for efficient similarity search, and a large language model for synthesis. "
        "The pipeline begins when a user asks a question. The question is embedded "
        "into the same vector space as the documents. A similarity search retrieves "
        "the most relevant chunks. These chunks are then passed as context to the LLM, "
        "which generates a grounded answer. This architecture allows the system to "
        "handle documents it has never seen during training, making it ideal for "
        "enterprise and personal knowledge management applications. "
    ) * 3  # Repeat to ensure enough length for multiple chunks


@pytest.fixture
def sample_pdf(tmp_path):
    """Creates a temporary PDF file with known text content."""
    pdf_path = tmp_path / "test_document.pdf"
    doc = fitz.open()

    page1 = doc.new_page()
    page1.insert_text(
        (72, 72),
        "Retrieval-Augmented Generation (RAG) is a powerful technique for building "
        "knowledge assistants. It combines vector search with language models to "
        "provide accurate, cited answers from your own documents. The key advantage "
        "of RAG over pure LLM approaches is that it grounds responses in actual "
        "source material, dramatically reducing hallucinations.",
        fontsize=11,
    )

    page2 = doc.new_page()
    page2.insert_text(
        (72, 72),
        "FAISS (Facebook AI Similarity Search) is a library for efficient similarity "
        "search and clustering of dense vectors. It is commonly used in RAG pipelines "
        "to store and retrieve document embeddings. Sentence Transformers provide the "
        "embedding model that converts text chunks into dense vector representations.",
        fontsize=11,
    )

    doc.save(str(pdf_path))
    doc.close()
    return str(pdf_path)


@pytest.fixture
def empty_pdf(tmp_path):
    """Creates a PDF with no extractable text."""
    pdf_path = tmp_path / "empty.pdf"
    doc = fitz.open()
    doc.new_page()  # blank page
    doc.save(str(pdf_path))
    doc.close()
    return str(pdf_path)


@pytest.fixture
def temp_vectorstore(tmp_path, monkeypatch):
    """Provides a temporary vectorstore directory and patches paths in ingest and ask modules."""
    vs_dir = tmp_path / "vectorstore"
    vs_dir.mkdir()

    index_path = vs_dir / "faiss.index"
    meta_path = vs_dir / "meta.json"

    import rag.ingest as ingest_mod
    import rag.ask as ask_mod

    monkeypatch.setattr(ingest_mod, "INDEX_PATH", index_path)
    monkeypatch.setattr(ingest_mod, "META_PATH", meta_path)
    monkeypatch.setattr(ask_mod, "INDEX_PATH", index_path)
    monkeypatch.setattr(ask_mod, "META_PATH", meta_path)

    return {"dir": vs_dir, "index_path": index_path, "meta_path": meta_path}


@pytest.fixture
def mock_llm_response():
    """Creates a mock OpenAI/Groq completion response."""
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = (
        "Based on the provided context, RAG is a technique that combines "
        "retrieval with generation. [Source 1, Page 1]"
    )
    mock_response.choices = [mock_choice]
    return mock_response


@pytest.fixture
def temp_uploads(tmp_path, monkeypatch):
    """Provides a temporary uploads directory and patches the UPLOAD_DIR in main."""
    uploads_dir = tmp_path / "uploads"
    uploads_dir.mkdir()

    import main

    monkeypatch.setattr(main, "UPLOAD_DIR", uploads_dir)

    return uploads_dir

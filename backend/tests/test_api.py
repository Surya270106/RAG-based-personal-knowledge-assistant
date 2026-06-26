"""Tests for FastAPI endpoints."""
import pytest
import io
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import fitz
from main import app


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def pdf_bytes():
    """Generate a valid PDF as bytes for upload testing."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (72, 72),
        "This is a test document for the DocMind RAG pipeline. "
        "It contains enough text to be processed and chunked properly. "
        "The content discusses retrieval-augmented generation and its benefits "
        "for building knowledge management applications.",
        fontsize=11,
    )
    pdf_data = doc.tobytes()
    doc.close()
    return pdf_data


class TestUploadEndpoint:
    """Tests for POST /upload."""

    def test_upload_pdf_success(self, client, pdf_bytes, temp_vectorstore, temp_uploads):
        """Uploading a valid PDF returns 200 with document_id and chunks_indexed."""
        response = client.post(
            "/upload",
            files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert "chunks_indexed" in data
        assert data["chunks_indexed"] > 0
        assert data["message"] == "Uploaded successfully"

    def test_upload_non_pdf_rejected(self, client):
        """Uploading a non-PDF file returns 400."""
        response = client.post(
            "/upload",
            files={"file": ("notes.txt", io.BytesIO(b"hello world"), "text/plain")},
        )
        assert response.status_code == 400
        assert "PDF" in response.json()["detail"]

    def test_upload_saves_file_to_disk(
        self, client, pdf_bytes, temp_vectorstore, temp_uploads
    ):
        """Uploaded file is persisted in the uploads directory."""
        client.post(
            "/upload",
            files={"file": ("saved.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        saved_files = list(temp_uploads.iterdir())
        assert len(saved_files) == 1
        assert saved_files[0].name.endswith("_saved.pdf")


class TestAskEndpoint:
    """Tests for POST /ask."""

    @patch("rag.ask.client")
    def test_ask_endpoint_success(
        self,
        mock_llm,
        client,
        pdf_bytes,
        temp_vectorstore,
        temp_uploads,
        mock_llm_response,
    ):
        """POST /ask with a valid question returns an answer."""
        # First upload a document
        upload_res = client.post(
            "/upload",
            files={"file": ("test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        doc_id = upload_res.json()["document_id"]

        mock_llm.chat.completions.create.return_value = mock_llm_response

        response = client.post(
            "/ask", json={"question": "What is RAG?", "document_ids": [doc_id]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "sources" in data

    def test_ask_missing_question_returns_422(self, client):
        """POST /ask without a question field returns 422 validation error."""
        response = client.post("/ask", json={})
        assert response.status_code == 422

    def test_cors_headers_present(self, client):
        """Responses include CORS headers for cross-origin requests."""
        response = client.options(
            "/ask",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

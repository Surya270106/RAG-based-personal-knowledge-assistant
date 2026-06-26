"""Tests for PDF ingestion pipeline."""
import pytest
import json
from rag.ingest import ingest_pdf


class TestIngestPDF:
    """Tests for ingest_pdf() and related functions."""

    def test_ingest_creates_faiss_index(self, sample_pdf, temp_vectorstore):
        """After ingestion, the FAISS index file is created on disk."""
        ingest_pdf(sample_pdf, doc_id="test-001", filename="test.pdf")
        assert temp_vectorstore["index_path"].exists()

    def test_ingest_creates_metadata_file(self, sample_pdf, temp_vectorstore):
        """After ingestion, meta.json is created with correct structure."""
        ingest_pdf(sample_pdf, doc_id="test-002", filename="test.pdf")
        assert temp_vectorstore["meta_path"].exists()
        meta = json.loads(temp_vectorstore["meta_path"].read_text())
        assert isinstance(meta, list)
        assert len(meta) > 0

    def test_ingest_returns_chunk_count(self, sample_pdf, temp_vectorstore):
        """ingest_pdf returns a dict with chunks_indexed > 0."""
        result = ingest_pdf(sample_pdf, doc_id="test-003", filename="test.pdf")
        assert "chunks_indexed" in result
        assert result["chunks_indexed"] > 0

    def test_ingest_metadata_has_required_fields(self, sample_pdf, temp_vectorstore):
        """Each metadata entry has doc_id, filename, page, chunk_index, text."""
        ingest_pdf(sample_pdf, doc_id="test-004", filename="report.pdf")
        meta = json.loads(temp_vectorstore["meta_path"].read_text())
        for entry in meta:
            assert "doc_id" in entry
            assert "filename" in entry
            assert "page" in entry
            assert "chunk_index" in entry
            assert "text" in entry
            assert entry["doc_id"] == "test-004"
            assert entry["filename"] == "report.pdf"

    def test_ingest_empty_pdf_raises_error(self, empty_pdf, temp_vectorstore):
        """Ingesting a PDF with no readable text raises ValueError."""
        with pytest.raises(ValueError, match="No readable text"):
            ingest_pdf(empty_pdf, doc_id="test-005", filename="empty.pdf")

    def test_ingest_invalid_path_raises_error(self, temp_vectorstore):
        """Ingesting a non-existent file raises an error."""
        with pytest.raises(Exception):
            ingest_pdf("/nonexistent/fake.pdf", doc_id="test-006", filename="fake.pdf")

    def test_ingest_multiple_documents_appends(self, sample_pdf, temp_vectorstore, tmp_path):
        """Ingesting a second PDF appends to existing index and metadata."""
        import fitz

        result1 = ingest_pdf(sample_pdf, doc_id="doc-A", filename="first.pdf")

        # Create second PDF
        pdf2_path = tmp_path / "second_doc.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(
            (72, 72),
            "Machine learning models require training data and evaluation metrics. "
            "Common metrics include accuracy, precision, recall, and F1 score. "
            "Cross-validation helps ensure model generalization across different data splits.",
            fontsize=11,
        )
        doc.save(str(pdf2_path))
        doc.close()

        result2 = ingest_pdf(str(pdf2_path), doc_id="doc-B", filename="second.pdf")

        meta = json.loads(temp_vectorstore["meta_path"].read_text())
        doc_ids = {entry["doc_id"] for entry in meta}
        assert "doc-A" in doc_ids
        assert "doc-B" in doc_ids
        assert len(meta) == result1["chunks_indexed"] + result2["chunks_indexed"]

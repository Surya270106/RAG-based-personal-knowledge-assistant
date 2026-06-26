"""Tests for the question-answering pipeline."""
import pytest
import json
from unittest.mock import patch, MagicMock
from rag.ask import answer_question, load_meta
from rag.ingest import ingest_pdf


class TestLoadMeta:
    """Tests for load_meta() utility."""

    def test_load_meta_returns_empty_when_no_file(self, temp_vectorstore):
        """load_meta() returns [] when meta.json does not exist."""
        result = load_meta()
        assert result == []

    def test_load_meta_returns_data_after_ingest(self, sample_pdf, temp_vectorstore):
        """load_meta() returns populated list after a PDF has been ingested."""
        ingest_pdf(sample_pdf, doc_id="meta-test", filename="test.pdf")
        result = load_meta()
        assert isinstance(result, list)
        assert len(result) > 0


class TestAnswerQuestion:
    """Tests for answer_question() function."""

    def test_ask_no_index_returns_fallback(self, temp_vectorstore):
        """When no FAISS index exists, returns a 'no documents' message."""
        result = answer_question("What is RAG?")
        assert "answer" in result
        assert "sources" in result
        assert "No documents indexed" in result["answer"]
        assert result["sources"] == []

    @patch("rag.ask.client")
    def test_ask_returns_answer_and_sources(
        self, mock_client, sample_pdf, temp_vectorstore, mock_llm_response
    ):
        """After ingestion, answer_question returns answer and sources keys."""
        ingest_pdf(sample_pdf, doc_id="ask-001", filename="test.pdf")
        mock_client.chat.completions.create.return_value = mock_llm_response

        result = answer_question("What is RAG?")
        assert "answer" in result
        assert "sources" in result
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 0

    @patch("rag.ask.client")
    def test_ask_sources_have_correct_structure(
        self, mock_client, sample_pdf, temp_vectorstore, mock_llm_response
    ):
        """Each source in the response has filename, page, chunk_text."""
        ingest_pdf(sample_pdf, doc_id="ask-002", filename="test.pdf")
        mock_client.chat.completions.create.return_value = mock_llm_response

        result = answer_question("What is FAISS?")
        for source in result["sources"]:
            assert "filename" in source
            assert "page" in source
            assert "chunk_text" in source

    @patch("rag.ask.client")
    def test_ask_with_document_filter(
        self, mock_client, sample_pdf, temp_vectorstore, mock_llm_response
    ):
        """Filtering by document_ids restricts sources to matching docs."""
        ingest_pdf(sample_pdf, doc_id="filter-doc", filename="filtered.pdf")
        mock_client.chat.completions.create.return_value = mock_llm_response

        result = answer_question("What is RAG?", document_ids=["filter-doc"])
        for source in result["sources"]:
            assert source["filename"] == "filtered.pdf"

    @patch("rag.ask.client")
    def test_ask_passes_chat_history(
        self, mock_client, sample_pdf, temp_vectorstore, mock_llm_response
    ):
        """Chat history is forwarded to the LLM call."""
        ingest_pdf(sample_pdf, doc_id="hist-001", filename="test.pdf")
        mock_client.chat.completions.create.return_value = mock_llm_response

        history = [
            {"role": "user", "content": "What is RAG?"},
            {
                "role": "assistant",
                "content": "RAG stands for Retrieval-Augmented Generation.",
            },
        ]
        answer_question("Tell me more", chat_history=history)

        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs.get("messages", call_args[1].get("messages", []))
        # System prompt + 2 history messages + 1 user message = 4
        assert len(messages) == 4

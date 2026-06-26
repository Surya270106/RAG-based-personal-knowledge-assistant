"""Tests for the text chunking utility in the RAG pipeline."""
import pytest
from rag.ingest import chunk_text


class TestChunkText:
    """Tests for chunk_text() function."""

    def test_chunk_basic_produces_chunks(self, sample_text):
        """Chunking normal text produces a non-empty list of strings."""
        chunks = chunk_text(sample_text)
        assert len(chunks) > 0
        assert all(isinstance(c, str) for c in chunks)

    def test_chunk_overlap_shared_content(self):
        """Consecutive chunks share overlapping content."""
        text = "A" * 2000  # 2000 chars with default chunk=1000, overlap=150
        chunks = chunk_text(text, chunk_size=1000, overlap=150)
        assert len(chunks) >= 2
        # The end of chunk[0] should overlap with start of chunk[1]
        tail_of_first = chunks[0][-150:]
        head_of_second = chunks[1][:150]
        assert tail_of_first == head_of_second

    def test_chunk_small_text_single_chunk(self):
        """Text shorter than chunk_size returns exactly one chunk."""
        text = "This is a short text."
        chunks = chunk_text(text, chunk_size=1000, overlap=150)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunk_empty_text_returns_empty(self):
        """Empty string returns an empty list."""
        chunks = chunk_text("", chunk_size=1000, overlap=150)
        assert chunks == []

    def test_chunk_custom_parameters(self):
        """Custom chunk_size and overlap are respected."""
        text = "X" * 500
        chunks = chunk_text(text, chunk_size=200, overlap=50)
        assert len(chunks) >= 3
        assert all(len(c) <= 200 for c in chunks)

    def test_chunk_exact_boundary(self):
        """Text exactly equal to chunk_size returns one chunk."""
        text = "B" * 1000
        chunks = chunk_text(text, chunk_size=1000, overlap=150)
        assert len(chunks) == 1
        assert chunks[0] == text

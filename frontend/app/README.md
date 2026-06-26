# RAG Assistant — Chat with Your PDFs

A full-stack Retrieval-Augmented Generation (RAG) application that lets you upload any PDF and have a natural language conversation with it. Built with a FastAPI backend, FAISS vector store, and a Next.js frontend with Framer Motion animations.

## What it does

Upload a PDF — a research paper, contract, manual, report, anything — and ask questions about it in plain English. The assistant finds the most relevant passages, sends them to an LLM, and gives you a precise answer with citations showing exactly which page the information came from.

No hallucinations. No guessing. Every answer is grounded in your document.

---

## Features

- **Semantic search** — finds contextually relevant passages, not just keyword matches
- **Source citations** — every answer links back to the exact page in your PDF
- **Multi-turn chat** — follow-up questions work naturally with conversation history
- **Local vector store** — your documents never leave your machine (FAISS runs locally)
- **Fast responses** — powered by Groq's LLaMA 3.3 70B, answers in under 2 seconds
- **Clean UI** — animated Next.js frontend with drag-and-drop PDF upload

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Framer Motion, Axios |
| Backend | FastAPI, Python |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Vector DB | FAISS (local) |
| LLM | Groq API — LLaMA 3.3 70B |
| PDF Parsing | PyPDF |

---

## Project Structure

```
rag-assistant/
├── backend/
│   ├── main.py              # FastAPI app, /upload and /ask endpoints
│   ├── rag/
│   │   ├── ingest.py        # PDF parsing, chunking, embedding, FAISS indexing
│   │   └── ask.py           # Semantic search + LLM answer generation
│   ├── uploads/             # Uploaded PDFs (git-ignored)
│   ├── vectorstore/         # FAISS index + metadata (git-ignored)
│   └── .env                 # API keys (git-ignored)
├── frontend/
│   ├── app/
│   │   └── page.tsx         # Main UI — hero, chat interface, features, pipeline
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/rag-assistant.git
cd rag-assistant
```

### 2. Set up the backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Mac/Linux
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pypdf sentence-transformers faiss-cpu openai python-dotenv numpy
```

Create a `.env` file inside `backend/`:

```
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Use it

1. Open `http://localhost:3000`
2. Drag and drop any PDF into the upload zone
3. Wait a moment for it to be indexed
4. Ask any question about your document
5. Click the source chips to see the exact passage used to generate the answer

---

## How It Works

```
PDF Upload
    │
    ▼
Extract text page by page (PyPDF)
    │
    ▼
Split into 1000-char overlapping chunks
    │
    ▼
Embed each chunk (Sentence Transformers)
    │
    ▼
Store vectors in FAISS index
    │
    ▼
User asks a question
    │
    ▼
Embed the question → search FAISS for top-5 nearest chunks
    │
    ▼
Inject chunks as context into LLaMA 3.3 70B via Groq
    │
    ▼
Return answer + source citations
```

---

## API Endpoints

### `POST /upload`
Upload a PDF file for indexing.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "message": "Uploaded successfully",
  "document_id": "uuid-string",
  "chunks_indexed": 42
}
```

### `POST /ask`
Ask a question about an indexed document.

**Request:**
```json
{
  "question": "What is the main conclusion?",
  "document_ids": ["uuid-string"],
  "chat_history": []
}
```

**Response:**
```json
{
  "answer": "According to Source 1 (page 4)...",
  "sources": [
    {
      "filename": "paper.pdf",
      "page": 4,
      "chunk_text": "The study concludes that..."
    }
  ]
}
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |

---

## License

MIT
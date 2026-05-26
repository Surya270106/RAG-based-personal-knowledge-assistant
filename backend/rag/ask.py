from dotenv import load_dotenv
load_dotenv()
import json
import os
import numpy as np
import faiss


from pathlib import Path
from sentence_transformers import SentenceTransformer
from openai import OpenAI

MODEL_NAME = "all-MiniLM-L6-v2"

model = SentenceTransformer(MODEL_NAME)

INDEX_PATH = Path("vectorstore/faiss.index")
META_PATH = Path("vectorstore/meta.json")

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

def load_meta():
    if META_PATH.exists():
        return json.loads(META_PATH.read_text())

    return []

def answer_question(
    question: str,
    document_ids=None,
    chat_history=None,
    top_k: int = 5
):
    if not INDEX_PATH.exists():
        return {
            "answer": "No documents indexed yet.",
            "sources": []
        }

    index = faiss.read_index(str(INDEX_PATH))

    meta = load_meta()

    q_emb = model.encode(
        [question],
        normalize_embeddings=True
    )

    q_emb = np.array(q_emb).astype("float32")

    scores, indices = index.search(q_emb, top_k * 3)

    retrieved = []

    for idx in indices[0]:

        if idx < 0 or idx >= len(meta):
            continue

        item = meta[idx]

        if document_ids and item["doc_id"] not in document_ids:
            continue

        retrieved.append(item)

        if len(retrieved) >= top_k:
            break

    context_blocks = []

    for i, item in enumerate(retrieved, start=1):

        context_blocks.append(
            f"[Source {i}] "
            f"{item['filename']} - Page {item['page']}\n"
            f"{item['text']}"
        )

    context = "\n\n".join(context_blocks)

    system_prompt = (
        "You are a document QA assistant. "
        "Answer ONLY using the provided context. "
        "If the answer is not in the context, "
        "say you do not know. "
        "Cite sources by source number and page."
    )

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    if chat_history:
        messages.extend(chat_history)

    messages.append({
        "role": "user",
        "content": (
            f"Context:\n{context}\n\n"
            f"Question: {question}"
        )
    })

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.2
    )

    sources = [
        {
            "filename": item["filename"],
            "page": item["page"],
            "chunk_text": item["text"]
        }
        for item in retrieved
    ]

    return {
        "answer": completion.choices[0].message.content,
        "sources": sources
    }
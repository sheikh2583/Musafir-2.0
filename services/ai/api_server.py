"""
Musafir — AI Chat Service (LangChain + Ollama + ChromaDB)
=========================================================
Isolated from v1 core logic. Runs as an independent Flask service on port 5001.
The Node.js backend proxies /api/chat -> this service.

Usage:
    cd services/ai
    pip install -r requirements.txt
    python api_server.py

Requires:
    - Ollama running locally (ollama serve) with llama3.2 + nomic-embed-text pulled
    - ChromaDB populated via: python ingest.py
"""
import os
from flask import Flask, request, jsonify
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
import requests

app = Flask(__name__)

# ─── Configuration (read from env or use defaults) ───────────────────────
DB_PATH = os.environ.get("LANGCHAIN_CHROMA_DB_PATH", "./chroma_db")
EMBEDDING_MODEL_NAME = os.environ.get("LANGCHAIN_EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL = os.environ.get("LANGCHAIN_LLM_MODEL", "llama3.2")
OLLAMA_API_URL = os.environ.get("OLLAMA_API_URL", "http://127.0.0.1:11434/api/chat")
PORT = int(os.environ.get("LANGCHAIN_PORT", 5001))

# ─── Initialize Vector Store ─────────────────────────────────────────────
print(f"[AI Service] Loading vector store from {DB_PATH}...")
embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL_NAME)
vector_store = Chroma(
    persist_directory=DB_PATH,
    embedding_function=embeddings
)
print(f"[AI Service] Vector store loaded. Model: {LLM_MODEL}")


class FastOllama:
    """Lightweight Ollama client using direct HTTP API (no library overhead)."""

    def __init__(self, model):
        self.model = model

    def chat(self, messages):
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0,      # Greedy decoding — fully deterministic
                "top_k": 1,            # Only pick the single best token
                "top_p": 0.9,          # Nucleus sampling (narrow)
                "repeat_penalty": 1.1, # Discourage repetition
                "seed": 42,            # Fixed seed for reproducibility
                "num_ctx": 4096,       # Context window size
            }
        }
        try:
            response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
        except requests.exceptions.ConnectionError:
            return "Error: Could not connect to Ollama. Make sure 'ollama serve' is running."
        except Exception as e:
            print(f"[AI Service] Ollama Error: {e}")
            return f"Error: {e}"


llm = FastOllama(model=LLM_MODEL)

# ─── System Prompt Template ──────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """You are Musafir AI, a strictly accurate Islamic scholar assistant following the Hanafi school of jurisprudence (fiqh).

CRITICAL RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. ONLY answer based on the provided context from the Quran, Tafseer, and Hadith. Do NOT generate, assume, or fabricate any information.
2. If the answer is NOT clearly present in the context, respond ONLY with: "I don't have enough verified information to answer this question accurately. Please consult a qualified Hanafi scholar."
3. NEVER hallucinate, speculate, or paraphrase loosely. Every claim must be directly traceable to the provided context.
4. Follow the Hanafi fiqh methodology in all rulings and interpretations. If a matter has differences of opinion, present the Hanafi position first and clearly label it as such.
5. Always cite exact references — Surah name, Surah number, and Ayah number (e.g., Surah Al-Baqarah 2:255), or Hadith book and number.
6. Do NOT mix opinions from other schools of thought unless explicitly asked. If you do mention them, clearly distinguish them from the Hanafi ruling.
7. Be respectful, precise, and concise. Accuracy is more important than length.
8. If a question is outside the scope of Islamic knowledge, politely decline to answer.

Context:
{context}
"""


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": LLM_MODEL, "db_path": DB_PATH})


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query')
    history = data.get('history', [])

    if not query:
        return jsonify({"error": "No query provided"}), 400

    try:
        # 1. Retrieve relevant context from ChromaDB (more chunks = better coverage)
        docs = vector_store.similarity_search(query, k=8)
        context = "\n\n".join([doc.page_content for doc in docs])

        # 2. Build message chain
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)
        messages = [
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": query}
        ]

        # 3. Get LLM response
        response = llm.chat(messages)

        # 4. Format source citations
        sources = []
        for doc in docs:
            preview = doc.page_content[:80] + "..." if len(doc.page_content) > 80 else doc.page_content
            source_info = {"text": preview}
            if doc.metadata:
                source_info["metadata"] = doc.metadata
            sources.append(source_info)

        return jsonify({
            "response": response,
            "sources": sources
        })

    except Exception as e:
        print(f"[AI Service] Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print(f"[AI Service] Starting on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT)

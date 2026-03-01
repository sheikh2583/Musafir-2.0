"""
Incremental ingestion script - adds new files to existing ChromaDB
without wiping the database. Skips files already present by source path.
"""
import os
import re
import sys

# FORCE OFFLINE MODE
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

DB_PATH = "./chroma_db"
EMBEDDING_MODEL_NAME = "nomic-embed-text"


def load_pdf_as_text(file_path):
    """Extract text from PDF, clean it, and return as Document objects."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("  Installing PyMuPDF...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "PyMuPDF"])
        import fitz

    abs_path = os.path.abspath(file_path)
    print(f"  Extracting text from PDF with PyMuPDF...")
    doc = fitz.open(file_path)

    full_text = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")
        # Clean up: collapse excessive whitespace, strip page headers/footers
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()
        if text:
            full_text.append(text)

    doc.close()
    combined = "\n\n".join(full_text)
    print(f"  Extracted {len(combined):,} characters from {len(full_text)} pages")

    # Also save a .txt copy for reference
    txt_path = os.path.splitext(file_path)[0] + ".txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(combined)
    print(f"  Saved plain text copy: {txt_path}")

    return [Document(page_content=combined, metadata={"source": abs_path})]


def get_existing_sources(vector_store):
    """Get set of source filenames already in the DB."""
    collection = vector_store._collection
    total = collection.count()
    sources = set()
    batch = 5000
    for offset in range(0, total, batch):
        results = collection.get(limit=batch, offset=offset, include=["metadatas"])
        for m in results["metadatas"]:
            src = m.get("source", "")
            sources.add(src)
    return sources


def ingest_files(file_paths):
    """Ingest specific files into existing ChromaDB."""

    # 1. Initialize embeddings and vector store
    print(f"Connecting to ChromaDB at {DB_PATH}...")
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL_NAME)
    vector_store = Chroma(
        embedding_function=embeddings,
        persist_directory=DB_PATH,
    )

    # 2. Check existing sources
    print("Checking existing sources in DB...")
    existing_sources = get_existing_sources(vector_store)
    print(f"Found {len(existing_sources)} existing source(s):")
    for s in sorted(existing_sources):
        print(f"  - {s}")

    # 3. Load and split new documents
    all_chunks = []
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=100
    )

    for file_path in file_paths:
        abs_path = os.path.abspath(file_path)

        # Check if already ingested
        if abs_path in existing_sources:
            print(f"\nSKIPPING (already in DB): {abs_path}")
            continue

        if not os.path.exists(file_path):
            print(f"\nSKIPPING (file not found): {file_path}")
            continue

        print(f"\nLoading: {abs_path}")
        ext = os.path.splitext(file_path)[1].lower()

        docs = []
        if ext == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
            docs = loader.load()
        elif ext == ".pdf":
            docs = load_pdf_as_text(file_path)
        else:
            print(f"  Unsupported file type: {ext}")
            continue

        print(f"  Loaded {len(docs)} document(s)")

        chunks = text_splitter.split_documents(docs)
        print(f"  Split into {len(chunks)} chunks")
        all_chunks.extend(chunks)

    if not all_chunks:
        print("\nNo new chunks to ingest. Everything is already in the DB.")
        return

    # 4. Ingest in batches
    batch_size = 64
    total_batches = (len(all_chunks) + batch_size - 1) // batch_size
    print(f"\nIngesting {len(all_chunks)} new chunks in {total_batches} batches...")

    from tqdm import tqdm

    for i in tqdm(range(0, len(all_chunks), batch_size), desc="Ingesting"):
        batch = all_chunks[i : i + batch_size]
        vector_store.add_documents(documents=batch)

    # 5. Verify
    new_total = vector_store._collection.count()
    print(f"\nDone! ChromaDB now has {new_total} total chunks.")


if __name__ == "__main__":
    files_to_ingest = sys.argv[1:] if len(sys.argv) > 1 else ["data/tafseer.txt"]
    print(f"Files to ingest: {files_to_ingest}")
    ingest_files(files_to_ingest)

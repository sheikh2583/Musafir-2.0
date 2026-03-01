import os

# FORCE OFFLINE MODE
# These must be set before importing transformers/sentence_transformers
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import shutil
from langchain_community.document_loaders import DirectoryLoader, PyPDFDirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

# Configuration
DB_PATH = "./chroma_db"
EMBEDDING_MODEL_NAME = "nomic-embed-text"

def ingest():
    # 1. Load Data from data directory
    print("Loading documents from 'data' directory...")
    if not os.path.exists("data"):
        os.makedirs("data")
        # Create dummy file if empty
        with open("data/sample_data.txt", "w", encoding="utf-8") as f:
            f.write("LangChain is a framework for developing applications powered by language models.\n")
            f.write("Ollama allows you to run open-source large language models, locally.\n")
            f.write("Chroma is the open-source embedding database.\n")

    # Load both TXT, PDF, and JSON files
    documents = []
    
    # Load TXT files (use TextLoader to avoid needing 'unstructured' package)
    txt_loader = DirectoryLoader("data", glob="**/*.txt", loader_cls=TextLoader, loader_kwargs={"encoding": "utf-8"})
    txt_docs = txt_loader.load()
    documents.extend(txt_docs)
    print(f"Loaded {len(txt_docs)} TXT files")
    
    # Load PDF files
    pdf_loader = PyPDFDirectoryLoader("data")
    pdf_docs = pdf_loader.load()
    documents.extend(pdf_docs)
    print(f"Loaded {len(pdf_docs)} PDF files")
    
    # Load JSON files as text (avoids jq dependency)
    import json, glob as globmod
    from langchain_core.documents import Document
    json_files = globmod.glob(os.path.join("data", "**/*.json"), recursive=True)
    json_doc_count = 0
    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)
            text = json.dumps(data, ensure_ascii=False, indent=None)
            documents.append(Document(page_content=text, metadata={"source": os.path.abspath(jf)}))
            json_doc_count += 1
        except Exception as e:
            print(f"Error loading JSON {jf}: {e}")
    print(f"Loaded {json_doc_count} JSON files")

    if not documents:
        print("No documents found in 'data' directory!")
        return

    # 3. Split Text
    print("Splitting text...")
    # Semantic chunking was causing OOM (Memory) errors on large files
    # Reverting to RecursiveCharacterTextSplitter which is much more memory efficient
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    
    # 4. Initialize Embeddings
    print(f"Initializing embeddings ({EMBEDDING_MODEL_NAME})...")
    # Using OllamaEmbeddings for much faster processing
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL_NAME)

    # 4. Create Vector Store
    print("Creating Vector Store...")
    # Clean up old database if it exists to prevent duplicates
    if os.path.exists(DB_PATH):
        print(f"Removing old database at {DB_PATH}...")
        shutil.rmtree(DB_PATH)

    # Initialize empty Chroma DB
    vector_store = Chroma(
        embedding_function=embeddings,
        persist_directory=DB_PATH
    )

    # Process in batches with progress bar
    batch_size = 64
    total_batches = len(chunks) // batch_size + (1 if len(chunks) % batch_size > 0 else 0)
    
    print(f"Embedding {len(chunks)} chunks in {total_batches} batches...")
    
    from tqdm import tqdm
    for i in tqdm(range(0, len(chunks), batch_size), desc="Ingesting"):
        batch = chunks[i:i + batch_size]
        vector_store.add_documents(documents=batch)
    
    print(f"Ingestion complete! Vector store saved to {DB_PATH}")

if __name__ == "__main__":
    ingest()

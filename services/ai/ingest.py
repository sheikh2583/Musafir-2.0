import os

# FORCE OFFLINE MODE
# These must be set before importing transformers/sentence_transformers
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import shutil
from langchain_community.document_loaders import DirectoryLoader, PyPDFDirectoryLoader
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
    
    # Load TXT files
    txt_loader = DirectoryLoader("data", glob="**/*.txt")
    txt_docs = txt_loader.load()
    documents.extend(txt_docs)
    print(f"Loaded {len(txt_docs)} TXT files")
    
    # Load PDF files
    pdf_loader = PyPDFDirectoryLoader("data")
    pdf_docs = pdf_loader.load()
    documents.extend(pdf_docs)
    print(f"Loaded {len(pdf_docs)} PDF files")
    
    # Load JSON files
    json_loader = DirectoryLoader("data", glob="**/*.json", loader_cls=lambda path: __import__('langchain_community.document_loaders', fromlist=['JSONLoader']).JSONLoader(file_path=path, jq_schema='.', text_content=False))
    json_docs = json_loader.load()
    documents.extend(json_docs)
    print(f"Loaded {len(json_docs)} JSON files")

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

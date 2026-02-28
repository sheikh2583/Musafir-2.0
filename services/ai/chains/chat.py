import os

# FORCE OFFLINE MODE
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA

# Configuration
DB_PATH = "./chroma_db"
EMBEDDING_MODEL_NAME = "nomic-embed-text"
LLM_MODEL = "llama3.2"

def main():
    print("Initializing Chatbot...")

    # 1. Initialize Embeddings
    print("[DEBUG] Creating OllamaEmbeddings instance...")
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL_NAME)
    print("[DEBUG] OllamaEmbeddings created successfully")

    # 2. Connect to Vector Store
    print("Connecting to Vector Store...")
    print(f"[DEBUG] Loading Chroma from {DB_PATH}...")
    vector_store = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embeddings
    )
    print("[DEBUG] Chroma loaded successfully")
    
    # Check if vector store has data
    # Note: Chroma doesn't have a direct 'count' method on the client easily accessible without collection access,
    # but we can assume it works if ingest ran.
    print("[DEBUG] Creating retriever...")
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    print("[DEBUG] Retriever created")

    # 3. Initialize LLM
    print(f"Loading LLM ({LLM_MODEL})...")
    print("[DEBUG] Creating ChatOllama instance...")
    llm = ChatOllama(model=LLM_MODEL, temperature=0)
    print("[DEBUG] ChatOllama created")

    # 4. Create Chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )

    print("\nChatbot is ready! Type 'exit' to quit.\n")

    while True:
        query = input("You: ")
        if query.lower() in ["exit", "quit", "q"]:
            print("Goodbye!")
            break
        
        try:
            # Invoking the chain
            response = qa_chain.invoke({"query": query})
            
            print(f"\nBot: {response['result']}\n")
            
            # Print sources for debugging/verification
            print("Sources:")
            for doc in response['source_documents']:
                print(f"- {doc.metadata.get('source', 'Unknown')}: {doc.page_content[:50]}...")
            print("\n" + "-"*30 + "\n")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()

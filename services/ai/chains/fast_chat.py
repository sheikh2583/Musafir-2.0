import os
import time
import requests
import json

# FORCE OFFLINE MODE
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

print("Initializing Chatbot...")
# Use basic Chroma import (faster than the langchain wrapper mess)
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

# Configuration
DB_PATH = "./chroma_db"
EMBEDDING_MODEL_NAME = "nomic-embed-text"
LLM_MODEL = "llama3.2"
OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"  # Use 127.0.0.1 instead of localhost

class FastOllama:
    def __init__(self, model):
        self.model = model

    def chat(self, messages):
        """Send chat using direct HTTP API (instant, no library overhead)"""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False
        }
        try:
            # Add timeout to prevent indefinite hanging
            response = requests.post(OLLAMA_API_URL, json=payload, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            if "message" not in data:
                return f"Error: Unexpected response from Ollama: {data}"
                
            return data["message"]["content"]
            
        except requests.exceptions.ConnectionError:
            return "Error: Could not connect to Ollama. Make sure 'ollama serve' is running."
        except Exception as e:
            return f"Error talking to Ollama: {e}"

def main():
    # 1. Initialize Embeddings (Lazy)
    print("Loading database...")
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL_NAME)

    # 2. Connect to Vector Store
    try:
        vector_store = Chroma(
            persist_directory=DB_PATH,
            embedding_function=embeddings
        )
        # Create retriever
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    except Exception as e:
        print(f"Error loading database: {e}")
        return

    # 3. Initialize LLM (Fast custom client)
    print(f"Connecting to Ollama ({LLM_MODEL})...")
    llm = FastOllama(model=LLM_MODEL)

    print("\n⚡ Chatbot is ready! (Fast Mode)\nType 'exit' to quit.\n")

    history = []

    while True:
        query = input("You: ")
        if query.lower() in ["exit", "quit", "q"]:
            print("Goodbye!")
            break
        
        try:
            # 1. Retrieve context
            print("Thinking...", end="\r")
            docs = vector_store.similarity_search(query, k=3)
            context = "\n\n".join([doc.page_content for doc in docs])
            
            # 2. Construct prompt
            system_prompt = f"""You are a helpful assistant. Use the following context to answer the user's question.
            If the answer is not in the context, say you don't know.
            
            Context:
            {context}
            """
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
            
            # 3. Get answer
            response = llm.chat(messages)
            
            print(f"\nBot: {response}\n")
            
            # Print sources
            print("Sources:")
            for doc in docs:
                source = doc.metadata.get('source', 'Unknown')
                print(f"- {source}")
            print("\n" + "-"*30 + "\n")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()

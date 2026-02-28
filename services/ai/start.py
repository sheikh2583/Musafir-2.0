#!/usr/bin/env python
"""
Simple entry point for the chatbot.
Just run: python start.py
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("=" * 50)
    print("LangChain Chatbot - Setup Check")
    print("=" * 50)
    
    # Check if vector DB exists
    if not os.path.exists("chroma_db"):
        print("\n⚠️  Vector database not found!")
        print("Running ingestion first...\n")
        # Lazy import to speed up startup when ingestion isn't needed
        from ingest import ingest
        ingest()
        print("\n✅ Ingestion complete!\n")
    
    # Start chatbot
    print("Starting chatbot (Fast Mode)...\n")
    # Lazy import to avoid loading heavy libraries until needed
    from fast_chat import main as chat_main
    chat_main()

if __name__ == "__main__":
    main()

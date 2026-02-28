import json
import os

# Running from project root
SOURCE_FILE = "new tafseer/abridged-explanation-of-the-quran.json"
OUTPUT_DIR = "langchain/data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "tafseer.txt")

def convert():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print(f"Reading {SOURCE_FILE}...")
    try:
        with open(SOURCE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {SOURCE_FILE}")
        return

    print(f"Converting to text format in {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        # Sort keys to ensure order
        def parse_key(k):
            try:
                parts = k.split(':')
                return int(parts[0]), int(parts[1])
            except:
                return 0, 0

        sorted_keys = sorted(data.keys(), key=parse_key)

        count = 0
        for key in sorted_keys:
            entry = data[key]
            text = ""
            
            if isinstance(entry, dict):
                text = entry.get('text', '').strip()
            elif isinstance(entry, str):
                text = entry.strip()
            
            if text:
                f.write(f"Verse {key}:\n{text}\n\n")
                count += 1
    
    print(f"Successfully wrote {count} verses to {OUTPUT_FILE}")

if __name__ == "__main__":
    convert()

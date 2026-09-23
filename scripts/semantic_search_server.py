import os
import sqlite3
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI(title="Mission-RX BGE Semantic Search Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "dev.db")

print("⚡ Loading BAAI/bge-large-en-v1.5 into memory...")
model = SentenceTransformer("BAAI/bge-large-en-v1.5")
print("✅ BGE model loaded successfully.")

items_cache = []
embeddings_matrix = None

def load_matrix():
    global items_cache, embeddings_matrix
    if not os.path.exists(DB_PATH):
        print(f"Warning: {DB_PATH} not found.")
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, generic_name, passage, embedding FROM item_embeddings")
    rows = cursor.fetchall()
    conn.close()

    items_cache = []
    vectors = []
    for r in rows:
        item_id, gname, passage, blob = r
        vec = np.frombuffer(blob, dtype=np.float32)
        items_cache.append({
            "id": item_id,
            "genericName": gname,
            "passage": passage
        })
        vectors.append(vec)

    if vectors:
        embeddings_matrix = np.vstack(vectors)
        print(f"🚀 Loaded {len(items_cache)} vectors into RAM matrix (shape: {embeddings_matrix.shape})")
    else:
        print("⚠️ No vectors found in item_embeddings table.")

load_matrix()

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "BAAI/bge-large-en-v1.5",
        "items_count": len(items_cache)
    }

@app.get("/reload")
def reload():
    load_matrix()
    return {"status": "reloaded", "items_count": len(items_cache)}

@app.get("/search")
def search(q: str = Query(..., min_length=1), limit: int = 15, threshold: float = 0.35):
    if embeddings_matrix is None or len(items_cache) == 0:
        return {"results": []}

    formatted_query = f"{QUERY_PREFIX}{q.strip()}"
    query_vec = model.encode(formatted_query, normalize_embeddings=True)

    scores = np.dot(embeddings_matrix, query_vec)
    top_indices = np.argsort(scores)[::-1]
    
    results = []
    for idx in top_indices:
        score = float(scores[idx])
        if score < threshold and len(results) >= 3:
            break
        item = items_cache[idx]
        results.append({
            "id": item["id"],
            "genericName": item["genericName"],
            "passage": item["passage"],
            "score": round(score, 4)
        })
        if len(results) >= limit:
            break

    return {
        "query": q,
        "results": results
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5002)

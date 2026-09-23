import os
import sys
import json
import sqlite3
import numpy as np

# Force UTF-8 stdout on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from sentence_transformers import SentenceTransformer

print("[INFO] Loading BAAI/bge-large-en-v1.5...")
model = SentenceTransformer('BAAI/bge-large-en-v1.5')

# 1. Load Medical Knowledge Dictionary
with open('data/medicalKnowledge.json', 'r', encoding='utf-8') as f:
    drugs = json.load(f)

# 2. Load SQLite inventory items if dev.db exists
db_items = []
try:
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, genericName, brandName, dosage, shelfLocation, itemType, directions FROM InventoryItem")
    rows = cursor.fetchall()
    for r in rows:
        db_items.append({
            "id": r[0],
            "genericName": r[1],
            "brandName": r[2] or "",
            "dosage": r[3] or "",
            "category": r[4] or "General Medical",
            "itemType": r[5] or "Medication",
            "directions": r[6] or ""
        })
    conn.close()
    print(f"[INFO] Loaded {len(db_items)} items from dev.db")
except Exception as e:
    print(f"[NOTE] Could not query dev.db directly ({e}), proceeding with formulary dictionary.")

# Combine unique items
all_passages = []
indexed_items = []
seen_names = set()

for d in drugs:
    gname = d['genericName']
    seen_names.add(gname.lower().strip())
    brand = d.get('brandName', '')
    chem = d.get('chemicalName', '')
    cat = d.get('category', 'General Medical')
    dosage = d.get('defaultDosage', '')
    dirs = d.get('typicalDirections', '')
    contra = d.get('contraindications', '')
    
    passage = f"{gname} ({brand}) {dosage}. Category: {cat}. Drug Class: {chem}. Clinical Directions & Indications: {dirs}. Contraindications: {contra}"
    all_passages.append(passage)
    indexed_items.append({
        "id": f"dict_{gname.lower().replace(' ', '_')}",
        "genericName": gname,
        "brandName": brand,
        "category": cat,
        "dosage": dosage,
        "chemicalName": chem,
        "passage": passage
    })

# Add custom DB items not in dictionary
for item in db_items:
    if item['genericName'].lower().strip() not in seen_names:
        seen_names.add(item['genericName'].lower().strip())
        passage = f"{item['genericName']} ({item['brandName']}) {item['dosage']}. Category: {item['category']}. Type: {item['itemType']}. Directions: {item['directions']}"
        all_passages.append(passage)
        indexed_items.append({
            "id": item['id'],
            "genericName": item['genericName'],
            "brandName": item['brandName'],
            "category": item['category'],
            "dosage": item['dosage'],
            "chemicalName": item['itemType'],
            "passage": passage
        })

print(f"[INFO] Encoding {len(all_passages)} items with bge-large-en-v1.5 (1024-dim vectors)...")
item_embeddings = model.encode(all_passages, normalize_embeddings=True, show_progress_bar=True)

# Attach embeddings (round to 5 decimals for JSON compactness)
for idx, item in enumerate(indexed_items):
    item['embedding'] = [round(float(v), 5) for v in item_embeddings[idx]]

# 3. Pre-encode a rich list of common clinical queries and symptoms
common_queries = [
    "fever", "headache", "migraine", "pain relief", "severe pain", "mild pain", "back pain",
    "joint pain and swelling", "arthritis", "sprain and strain", "swollen ankle", "inflammation",
    "strep throat", "ear infection", "pneumonia", "bronchitis", "bacterial infection", "antibiotic",
    "amoxicillin", "cough and cold", "chest congestion", "mucus", "runny nose", "congestion",
    "allergy", "seasonal allergies", "allergic reaction", "hives and itching", "asthma", "wheezing", "inhaler",
    "high blood pressure", "hypertension", "blood pressure medication", "angina", "chest pain", "cholesterol",
    "heart disease", "diabetes", "high blood sugar", "type 2 diabetes", "insulin",
    "heartburn", "acid reflux", "gerd", "stomach pain and ulcer", "nausea and vomiting", "diarrhea",
    "constipation", "laxative", "stool softener", "dehydration and electrolyte",
    "eczema", "skin rash", "severe itching", "dermatitis", "topical steroid", "fungal infection",
    "athletes foot", "ringworm", "burns and scalds", "wound care and cuts", "acne", "skin antibacterial",
    "depression", "anxiety", "panic attack", "insomnia and sleep aid", "seizure",
    "blood thinner", "anticoagulant", "dvt prevention",
    "splint", "crutches", "mobility aid", "arm sling", "wrist brace", "knee brace",
    "ace bandage", "gauze and dressing", "sterile gloves", "surgical blade", "suture kit",
    "blood pressure cuff", "pulse oximeter", "stethoscope", "thermometer", "syringe and needle"
]

print(f"[INFO] Pre-encoding {len(common_queries)} common clinical search terms with query prefix...")
precomputed_queries = {}
query_inputs = [f"Represent this sentence for searching relevant passages: {q}" for q in common_queries]
query_embeddings = model.encode(query_inputs, normalize_embeddings=True, show_progress_bar=False)

for q, q_emb in zip(common_queries, query_embeddings):
    precomputed_queries[q.lower()] = [round(float(v), 5) for v in q_emb]

# 4. Save JSON index for Next.js / Vercel
output_json = {
    "model": "BAAI/bge-large-en-v1.5",
    "dimension": 1024,
    "queryPrefix": "Represent this sentence for searching relevant passages: ",
    "items": indexed_items,
    "precomputedQueries": precomputed_queries
}

with open('data/bge_semantic_index.json', 'w', encoding='utf-8') as f:
    json.dump(output_json, f)
print("[SUCCESS] Saved data/bge_semantic_index.json")

# 5. Save SQLite BLOBs into dev.db (matches previous project architecture)
try:
    conn = sqlite3.connect('dev.db')
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS item_embeddings (
            id TEXT PRIMARY KEY,
            generic_name TEXT,
            passage TEXT,
            embedding BLOB
        )
    """)
    for idx, item in enumerate(indexed_items):
        raw_blob = item_embeddings[idx].astype(np.float32).tobytes()
        cursor.execute("""
            INSERT OR REPLACE INTO item_embeddings (id, generic_name, passage, embedding)
            VALUES (?, ?, ?, ?)
        """, (item['id'], item['genericName'], item['passage'], raw_blob))
    conn.commit()
    conn.close()
    print("[SUCCESS] Stored raw 1024-dim embedding BLOBs in SQLite dev.db (table: item_embeddings)")
except Exception as e:
    print(f"[NOTE] SQLite BLOB note: {e}")

print("[SUCCESS] Formulary Semantic Indexing complete!")

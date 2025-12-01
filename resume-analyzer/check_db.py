from dotenv import load_dotenv
load_dotenv()
import os
from pymongo import MongoClient

mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    print("❌ MONGO_URI is missing from .env")
    exit()

try:
    client = MongoClient(mongo_uri)
    db = client["resume_analyzer"]
    collection = db["job_matches"]
    
    count = collection.count_documents({})
    print(f"✅ Connected! Total Documents found: {count}")
    
    print("\n--- Last 5 Matches ---")
    for doc in collection.find().sort("timestamp", -1).limit(5):
        print(f"ID: {doc.get('_id')}")
        print(f"User ID: {doc.get('userId')}  <-- CHECK THIS!")
        print(f"Type: {doc.get('type')}")
        print(f"Score: {doc.get('match_score')}")
        print("----------------------")

except Exception as e:
    print(f"❌ Connection Error: {e}")
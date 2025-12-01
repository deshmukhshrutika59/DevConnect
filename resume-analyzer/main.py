from dotenv import load_dotenv
load_dotenv()
import os
from fastapi import FastAPI, UploadFile, File, Form, Path
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from career_assistant import CareerAssistant

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["resume_analyzer"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant = CareerAssistant(db)

# Chat Endpoint
@app.post("/api/ai/chat")
async def chat_endpoint(
    message: str = Form(...),
    userId: str = Form(...),
    file: UploadFile = File(None)
):
    file_bytes = None
    filename = None
    if file:
        file_bytes = await file.read()
        filename = file.filename

    reply = await assistant.process_request(userId, message, file_bytes, filename)
    return {"reply": reply}

# NEW: History Endpoint
@app.get("/api/ai/history/{user_id}")
async def get_history(user_id: str = Path(...)):
    """Fetch chat history for the frontend"""
    # Retrieve raw history from MongoDB
    history_data = assistant._get_history(user_id)
    
    # Format for Frontend (convert 'role' to 'from')
    formatted_history = []
    for item in history_data:
        sender = "bot" if item["role"] == "model" else "user"
        # Combine parts into single string if it's a list
        text = "".join(item["parts"]) if isinstance(item["parts"], list) else item["parts"]
        formatted_history.append({"from": sender, "text": text})
        
    return {"history": formatted_history}

# ... (Keep existing resume endpoints below)
from resume_utils import extract_resume_text
from job_matcher import match_resume_to_title
from llm_feedback import generate_resume_feedback

@app.post("/match-job-title/")
async def match_from_title(resume_file: UploadFile = File(...), job_title: str = Form(...), userId: str = Form(None)):
    content = await resume_file.read()
    resume_text = extract_resume_text(content, resume_file.filename)
    ai_result = match_resume_to_title(resume_text, job_title)
    # ... logic to save result ...
    return ai_result # Simplified for brevity, keep your full logic

@app.post("/match-custom-jd/")
async def match_custom_jd(resume_file: UploadFile = File(...), jd_text: str = Form(...), userId: str = Form(None)):
    content = await resume_file.read()
    resume_text = extract_resume_text(content, resume_file.filename)
    ai_result = match_resume_to_title(resume_text, jd_text)
    # ... logic to save result ...
    return ai_result 

@app.post("/feedback/")
async def feedback_endpoint(resume_file: UploadFile = File(...), userId: str = Form(None)):
    content = await resume_file.read()
    resume_text = extract_resume_text(content, resume_file.filename)
    feedback = generate_resume_feedback(resume_text)
    return {"analysis_summary": feedback}
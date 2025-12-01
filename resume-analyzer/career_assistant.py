import os
import google.generativeai as genai
from datetime import datetime
from pymongo import MongoClient
import requests # New import for GitHub
from resume_utils import extract_resume_text

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class CareerAssistant:
    def __init__(self, db):
        self.chat_collection = db["chat_history"]
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def _get_history(self, user_id, limit=20):
        """Fetch recent conversation context"""
        cursor = self.chat_collection.find(
            {"userId": user_id},
            {"_id": 0, "role": 1, "parts": 1}
        ).sort("timestamp", 1) # Get in chronological order
        return list(cursor)

    def _save_interaction(self, user_id, user_text, ai_text):
        self.chat_collection.insert_many([
            {"userId": user_id, "role": "user", "parts": [user_text], "timestamp": datetime.utcnow()},
            {"userId": user_id, "role": "model", "parts": [ai_text], "timestamp": datetime.utcnow()}
        ])

    def _analyze_github(self, username):
        """Fetches public repo data from GitHub API"""
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=5"
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return f"Could not access GitHub profile for {username}. (Status: {response.status_code})"
            
            repos = response.json()
            if not repos:
                return f"User {username} has no public repositories."

            repo_summaries = []
            for r in repos:
                repo_summaries.append(f"- **{r['name']}** ({r['language']}): {r['description']}")
            
            return "\n".join(repo_summaries)
        except Exception as e:
            return f"Error fetching GitHub data: {str(e)}"

    async def process_request(self, user_id, message, file_bytes=None, filename=None):
        history = self._get_history(user_id)
        
        system_instruction = """
        You are DevConnect AI, a specialized Career Coach for Developers.
        Capabilities: Resume Analysis, GitHub Code Review, Interview Prep.
        Style: Encouraging, concise, technical. Use Markdown formatting (bold, bullets, code blocks).
        """

        # 1. Check for File (Resume)
        additional_context = ""
        if file_bytes and filename:
            try:
                resume_content = extract_resume_text(file_bytes, filename)
                additional_context += f"\n[SYSTEM: User uploaded {filename}]\n{resume_content}\n"
            except Exception as e:
                return f"Error reading file: {str(e)}"

        # 2. Check for GitHub Link
        if "github.com/" in message:
            try:
                # Extract username (e.g., github.com/shrutika -> shrutika)
                parts = message.split("github.com/")
                username = parts[1].split()[0].replace("/", "")
                github_data = self._analyze_github(username)
                additional_context += f"\n[SYSTEM: GitHub Data for {username}]\n{github_data}\n"
            except:
                pass # Fail silently if URL parsing fails

        # 3. Construct Final Prompt
        final_prompt = message
        if additional_context:
            final_prompt = f"{additional_context}\n\nUser Request: {message}"

        # 4. Generate Response
        chat = self.model.start_chat(history=history)
        try:
            if not history:
                response = chat.send_message(f"{system_instruction}\n\n{final_prompt}")
            else:
                response = chat.send_message(final_prompt)
            
            ai_reply = response.text
            
            # Save interaction specifically for the UI to load later
            # Note: We save the 'clean' message, not the huge prompt with resume text
            self._save_interaction(user_id, message, ai_reply)
            
            return ai_reply
        except Exception as e:
            print(f"AI Error: {e}")
            return "I'm having trouble connecting right now. Please try again."
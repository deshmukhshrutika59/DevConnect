from dotenv import load_dotenv
load_dotenv()
import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_resume_feedback(resume_text):
    # Updated to the working model
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    prompt = f"""
    You are a Senior Career Coach. Provide professional, constructive feedback on the following resume.
    Focus on structure, impact, and clarity.
    
    Resume:
    {resume_text}
    """
    
    response = model.generate_content(prompt)
    return response.text.strip()
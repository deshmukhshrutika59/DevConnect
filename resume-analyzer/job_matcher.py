from dotenv import load_dotenv
load_dotenv()
import os
import google.generativeai as genai
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def match_resume_to_title(resume_text, job_input):
    # Using the working model found in your check
    model = genai.GenerativeModel("gemini-2.0-flash")

    # We ask for structured data: Strengths, Weaknesses, Missing Skills
    prompt = f"""
    You are a Senior Technical Recruiter. Analyze the Resume against the Job Title/Description provided.
    
    Job Input: {job_input}
    
    Resume Content:
    {resume_text}
    
    Provide a detailed analysis in strictly valid JSON format with the following keys:
    1. "match_score": (Integer 0-100)
    2. "analysis_summary": (String, 2-3 sentences explaining the score)
    3. "strengths": (List of strings, top 3-5 matching skills found)
    4. "missing_skills": (List of strings, critical skills mentioned in JD but missing in Resume)
    5. "improvement_tips": (List of strings, actionable advice)

    Output JSON only. Do not wrap in markdown blocks.
    """

    try:
        response = model.generate_content(prompt)
        ai_output = response.text.strip()

        # --- CLEANING MARKDOWN (Crucial Step) ---
        # Gemini often adds markdown formatting like ```json ... ```
        if ai_output.startswith("```json"):
            ai_output = ai_output[7:]
        elif ai_output.startswith("```"):
            ai_output = ai_output[3:]
        
        if ai_output.endswith("```"):
            ai_output = ai_output[:-3]
        
        ai_output = ai_output.strip()
        
        return json.loads(ai_output)

    except Exception as e:
        print(f"AI MATCH ERROR: {e}")
        # Return a safe fallback so the app doesn't crash
        return {
            "match_score": 0,
            "analysis_summary": "Error analyzing resume. Please try again.",
            "strengths": [],
            "missing_skills": [],
            "improvement_tips": []
        }
# ---------------- resume_utils.py ----------------
import os
import docx
import tempfile
from pdfminer.high_level import extract_text

def extract_resume_text(content, filename):
    if filename.lower().endswith(".pdf"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
            f.write(content)
            return extract_text(f.name)
    elif filename.lower().endswith(".docx"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as f:
            f.write(content)
            doc = docx.Document(f.name)
            return "\n".join([p.text for p in doc.paragraphs])
    else:
        raise ValueError("Unsupported file format")
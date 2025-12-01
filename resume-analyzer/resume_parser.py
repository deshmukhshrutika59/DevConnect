# ---------------- resume_parser.py ----------------
# ai-resume-service/resume_parser.py
import pdfplumber
import docx2txt
import tempfile

def extract_resume_text(file_bytes, filename):
    if filename.lower().endswith(".pdf"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp.flush()
            with pdfplumber.open(tmp.name) as pdf:
                text = "\n".join([page.extract_text() or '' for page in pdf.pages])
        return text

    elif filename.lower().endswith(".docx"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            tmp.write(file_bytes)
            tmp.flush()
            text = docx2txt.process(tmp.name)
        return text

    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX are supported.")
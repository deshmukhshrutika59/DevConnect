# ---------------- skills_extractor.py ----------------
# ai-resume-service/skills_extractor.py
import spacy

nlp = spacy.load("en_core_web_sm")

def extract_keywords(text):
    doc = nlp(text)
    return sorted(set([
        token.text.lower()
        for token in doc
        if token.pos_ in ["NOUN", "PROPN"] and len(token.text) > 2
    ]))
import requests
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

API_KEY = os.getenv("OPENROUTER_API_KEY")

def analyze_with_llm(text):
    if not API_KEY:
        raise Exception("API key not found. Check your .env file.")

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openrouter/owl-alpha",
            "temperature": 0.1,
            "messages": [
                {
                    "role": "system",
                    "content": """You are a strict document classifier for an educational platform.
Return ONLY a raw JSON object. No markdown. No backticks. No explanation. No extra text.
Rules:
- field: broad academic discipline (Mathematics, Physics, Computer Science, Medicine, Law, Business)
- sub_field: specific topic inside that field (Calculus, Data Structures, Organic Chemistry)
- keywords: array of 5-8 key terms extracted from the document
- difficulty_level: exactly one of: beginner, intermediate, advanced
- summary: exactly 2 sentences. What the document covers + what level it targets.
Never return empty fields. Never return null. Always make your best guess."""
                },
                {
                    "role": "user",
                    "content": f"""Classify this educational document.

Return ONLY this JSON:
{{
    "field": "",
    "sub_field": "",
    "keywords": [],
    "difficulty_level": "",
    "summary": ""
}}

Document:
{text[:4000]}"""
                }
            ]
        }
    )

    result = response.json()

    if "choices" not in result:
        raise Exception(f"API Error: {result}")

    return result["choices"][0]["message"]["content"]


def generate_embedding(text):
    # Placeholder — returns zero vector
    # Replace with real embedding model when teacher matching is ready
    return [0.0] * 1536
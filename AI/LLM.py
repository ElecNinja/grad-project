import requests
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

API_KEY = os.getenv("OPENROUTER_API_KEY")

def analyze_with_llm(text):
    if not API_KEY:
        raise Exception("API key not found. Check your .env file.")

    prompt = f"""
    Analyze the document and Return ONLY raw JSON. Do NOT use markdown formatting.
    
    Required format:
    {{
        "field": "",
        "sub_field": "",
        "summary": ""
    }}
    Document:
    {text[:4000]}
    """

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "arcee-ai/trinity-large-preview:free",
            "messages": [{"role": "user", "content": prompt}],
            "reasoning": {"enabled": True}
        }
    )

    result = response.json()

    if "choices" not in result:
        raise Exception(f"API Error: {result}")

    return result["choices"][0]["message"]["content"]
import requests

API_KEY = "A7A"

def analyze_with_llm(text):
    prompt = f"""
    Analyze the document and Return ONLY raw JSON. Do NOT use markdown formatting like
    
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
    return result["choices"][0]["message"]["content"]
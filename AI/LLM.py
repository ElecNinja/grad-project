import requests

API_KEY = "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"

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
    print("FULL RESPONSE:", result)

    return result["choices"][0]["message"]["content"]

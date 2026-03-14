from fastapi import FastAPI, UploadFile, File
from pdf_extractor import extract_text_from_pdf
from LLM import analyze_with_llm
import json
import re
import tempfile

app = FastAPI()

@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        temp.write(await file.read())
        temp_path = temp.name

    text = extract_text_from_pdf(temp_path)

    result = analyze_with_llm(text)

    cleaned = result.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"```json|```", "", cleaned).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    json_text = cleaned[start:end]

    try:
        data = json.loads(json_text)

        return {
            "field": data["field"],
            "sub_field": data["sub_field"],
            "summary": data["summary"]
        }

    except:
        return {"error": "Model did not return valid JSON"}
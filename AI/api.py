from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pdf_extractor import extract_text_from_pdf
from LLM import analyze_with_llm
import json
import re
import tempfile
import requests
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# endpoint جديد للـ summarize من URL
@app.post("/summarize-from-url")
async def summarize_from_url(body: dict):
    try:
        pdf_url = body.get("pdfUrl")
        response = requests.get(pdf_url)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp.write(response.content)
            temp_path = temp.name

        text = extract_text_from_pdf(temp_path)
        result = analyze_with_llm(text)
        cleaned = result.strip()

        if cleaned.startswith("```"):
            cleaned = re.sub(r"```json|```", "", cleaned).strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        json_text = cleaned[start:end]

        data = json.loads(json_text)
        return {
            "field": data["field"],
            "sub_field": data["sub_field"],
            "summary": data["summary"]
        }
    except:
        return {"error": "Summarization failed"}
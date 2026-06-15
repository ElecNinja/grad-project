from pdf_extractor import extract_text_from_pdf
from LLM import analyze_with_llm, generate_embedding
import json
import re
import tempfile
import requests
import os
import time
import asyncio
from typing import Optional
# pyrefly: ignore [missing-import]
from supabase import create_client, Client
from pathlib import Path
# pyrefly: ignore [missing-import]
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, Form


load_dotenv(dotenv_path=Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
INTERNAL_MATCH_SECRET = os.getenv("INTERNAL_MATCH_SECRET", "aidemy_internal_match")

supabase: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    print("WARNING: Supabase credentials not found. Caching and database storage disabled.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grad-project-eta.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def trigger_matching(request_id: str, field: str, sub_field: str):
    """
    After saving analysis to DB, call the backend match endpoint.
    This runs teacher matching using the AI-extracted field/sub_field.
    """
    try:
        url = f"{BACKEND_URL}/api/student/match/{request_id}"
        payload = {
            "field": field,
            "sub_field": sub_field,
            "secret": INTERNAL_MATCH_SECRET,
        }
        response = requests.post(url, json=payload, timeout=15)
        print(f"[MATCH TRIGGER] status={response.status_code} body={response.text[:200]}")
    except Exception as e:
        print(f"[MATCH TRIGGER] Failed to call backend match endpoint: {e}")


def process_analysis_for_request(request_id: Optional[str], get_pdf_text_fn):
    # =============================================
    # 1. CACHE CHECK
    # Same request_id → return saved result, skip LLM
    # =============================================
    if request_id and supabase:
        try:
            cached = supabase.table("request_analysis").select("*").eq("request_id", request_id).execute()
            if cached.data and len(cached.data) > 0:
                print(f"[CACHE HIT] request_id={request_id}")
                row = cached.data[0]
                detected = row.get("detected_subjects", [])
                field = detected[0] if len(detected) > 0 else ""
                sub_field = detected[1] if len(detected) > 1 else ""

                # Ensure status is at least open (in case it got stuck at pending_analysis)
                try:
                    current = supabase.table("student_requests").select("status").eq("id", request_id).execute()
                    if current.data and current.data[0].get("status") == "pending_analysis":
                        supabase.table("student_requests").update({"status": "open"}).eq("id", request_id).execute()
                except Exception as ex:
                    print(f"[CACHE HIT] Failed to check/update status: {ex}")

                return {
                    "field": field,
                    "sub_field": sub_field,
                    "keywords": row.get("extracted_keywords", []),
                    "summary": row.get("summary", ""),
                    "difficulty_level": row.get("difficulty_level", "intermediate"),
                    "cached": True,
                }
        except Exception as e:
            print(f"[CACHE] Query failed: {e}")

    # =============================================
    # 2. EXTRACT PDF TEXT
    # =============================================
    start_time = time.time()
    text = get_pdf_text_fn()

    # =============================================
    # 3. ANALYZE WITH LLM
    # =============================================
    result = analyze_with_llm(text)
    cleaned = result.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"```json|```", "", cleaned).strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    json_text = cleaned[start:end]

    try:
        data = json.loads(json_text)
    except Exception as e:
        print(f"[LLM] JSON parse error: {e}")
        return {"error": "Model did not return valid JSON"}

    field = data.get("field", "")
    sub_field = data.get("sub_field", "")
    keywords = data.get("keywords", [])
    summary = data.get("summary", "")
    difficulty_level = data.get("difficulty_level", "intermediate")

    # =============================================
    # 4. GENERATE EMBEDDING (placeholder zeros)
    # =============================================
    embedding = None
    if supabase:
        try:
            kw_list = [str(k) for k in keywords] if isinstance(keywords, list) else []
            text_to_embed = f"Subjects: {field}, {sub_field}. Keywords: {', '.join(kw_list)}. Summary: {summary}"
            embedding = generate_embedding(text_to_embed)
        except Exception as e:
            print(f"[EMBEDDING] Error: {e}")

    processing_ms = int((time.time() - start_time) * 1000)

    # =============================================
    # 5. SAVE TO DB + UPDATE STATUS
    # =============================================
    if request_id and supabase:
        try:
            # Double-check no row exists (race condition guard)
            check = supabase.table("request_analysis").select("id").eq("request_id", request_id).execute()
            if not check.data:
                analysis_data = {
                    "request_id": request_id,
                    "extracted_keywords": keywords,
                    "detected_subjects": [field, sub_field],
                    "difficulty_level": difficulty_level,
                    "summary": summary,
                    "embedding": embedding,
                    "model_used": "openrouter/owl-alpha",
                    "processing_ms": processing_ms,
                }
                supabase.table("request_analysis").insert(analysis_data).execute()
                print(f"[DB] Saved request_analysis for request_id={request_id}")

                # Set status to open before triggering match
                supabase.table("student_requests").update({"status": "open"}).eq("id", request_id).execute()
                print(f"[DB] Status set to open for request_id={request_id}")

                # =============================================
                # 6. TRIGGER TEACHER MATCHING ON BACKEND
                # =============================================
                trigger_matching(request_id, field, sub_field)

            else:
                print(f"[DB] Row already exists for request_id={request_id}, skipping insert.")

        except Exception as e:
            print(f"[DB] Save failed: {e}")

    return {
        "field": field,
        "sub_field": sub_field,
        "keywords": keywords,
        "summary": summary,
        "difficulty_level": difficulty_level,
        "cached": False,
    }


@app.get("/")
def health():
    return {"status": "AI service running"}


@app.post("/analyze-pdf")
async def analyze_pdf(
    request_id: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    file_data = await file.read()

    def get_text():
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp.write(file_data)
            temp_path = temp.name
        try:
            return extract_text_from_pdf(temp_path)
        finally:
            try:
                os.unlink(temp_path)
            except:
                pass

    # Run the blocking CPU/IO work (PDF parsing + LLM call) in a thread pool
    # so the FastAPI event loop is not frozen during 30-60s LLM waits.
    result = await asyncio.to_thread(process_analysis_for_request, request_id, get_text)
    return result


@app.post("/summarize-from-url")
async def summarize_from_url(body: dict):
    pdf_url = body.get("pdfUrl")
    request_id = body.get("request_id") or body.get("requestId")

    def get_text():
        response = requests.get(pdf_url)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp.write(response.content)
            temp_path = temp.name
        try:
            return extract_text_from_pdf(temp_path)
        finally:
            try:
                os.unlink(temp_path)
            except:
                pass

    result = await asyncio.to_thread(process_analysis_for_request, request_id, get_text)
    return result




if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
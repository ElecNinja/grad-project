import fitz  # PyMuPDF
import base64
import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load env variables
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
API_KEY = os.getenv("OPENROUTER_API_KEY")

def ocr_image_via_api(image_bytes):
    if not API_KEY:
        return ""
    
    try:
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "nvidia/nemotron-nano-12b-v2-vl:free",  # Permanently free vision model on OpenRouter for OCR
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all readable text from this document image. Output ONLY the extracted text. Do not add any introduction, explanations, metadata, or formatting."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ]
            },
            timeout=30
        )
        
        result = response.json()
        if "choices" in result:
            return result["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"OCR API Error: {e}")
    return ""

def extract_text_from_pdf(path):
    doc = fitz.open(path)
    full_text = ""

    for page in doc:
        text = page.get_text().strip()

        # If text is present on the page, use it.
        # Otherwise, render the page as an image and perform OCR using the Vision API.
        if len(text) > 50:
            full_text += text + "\n"
        else:
            # Render page to a PNG image at 150 DPI for good OCR quality while keeping file size small
            pix = page.get_pixmap(dpi=150)
            image_bytes = pix.tobytes("png")
            ocr_text = ocr_image_via_api(image_bytes)
            if ocr_text:
                full_text += ocr_text + "\n"

    return full_text
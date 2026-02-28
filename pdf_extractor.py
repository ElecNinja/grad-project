import fitz  # PyMuPDF
import easyocr
import numpy as np
from PIL import Image
import io

reader = easyocr.Reader(['en'], verbose=False)

def extract_text_from_pdf(path):
    doc = fitz.open(path)
    full_text = ""

    for page in doc:
        text = page.get_text().strip()

        if text:
            full_text += text + "\n"
        else:
            images = page.get_images(full=True)

            for img in images:
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]

                image = Image.open(io.BytesIO(image_bytes))
                image_np = np.array(image)

                ocr_text = reader.readtext(image_np, detail=0)
                full_text += " ".join(ocr_text) + "\n"

    return full_text
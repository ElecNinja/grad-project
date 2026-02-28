from pdf_extractor import extract_text_from_pdf
from LLM import analyze_with_llm
import json
text = extract_text_from_pdf("sample.pdf")

with open("output.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Text saved to output.txt")

result = analyze_with_llm(text)

print("RAW RESPONSE:\n", result)

cleaned = result.strip()


if cleaned.startswith("```"):
    cleaned = re.sub(r"```json|```", "", cleaned).strip()

start = cleaned.find("{")
end = cleaned.rfind("}") + 1
json_text = cleaned[start:end]


try:
    data = json.loads(result)
    print("\nField:", data["field"])
    print("Sub Field:", data["sub_field"])
    print("Summary:", data["summary"])
except:
    print("\n Model did not return valid JSON")
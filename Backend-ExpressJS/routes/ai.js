const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const supabase = require("../config/supabase");

const upload = multer({ storage: multer.memoryStorage() });

// Port the LLM analysis logic entirely to Node.js
async function analyzeWithLLM(text) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing in .env");

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/owl-alpha",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a strict document classifier for an educational platform.
Return ONLY a raw JSON object. No markdown. No backticks. No explanation. No extra text.
Rules:
- field: broad academic discipline (Mathematics, Physics, Computer Science, Medicine, Law, Business)
- sub_field: specific topic inside that field (Calculus, Data Structures, Organic Chemistry)
- keywords: array of 5-8 key terms extracted from the document
- difficulty_level: exactly one of: beginner, intermediate, advanced
- summary: exactly 2 sentences. What the document covers + what level it targets.
Never return empty fields. Never return null. Always make your best guess.`,
        },
        {
          role: "user",
          content: `Classify this educational document.

Return ONLY this JSON:
{
    "field": "",
    "sub_field": "",
    "keywords": [],
    "difficulty_level": "",
    "summary": ""
}

Document:
${text.substring(0, 4000)}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  let content = response.data.choices[0].message.content.trim();
  if (content.startsWith("```")) {
    content = content.replace(/```json|```/g, "").trim();
  }
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}") + 1;
  const jsonText = content.substring(start, end);

  return JSON.parse(jsonText);
}

// Native Node.js AI endpoint (No Python required!)
router.post("/analyze-pdf", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const request_id = req.body.request_id || null;

    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    // 1. CACHE CHECK
    if (request_id) {
      const { data: cached } = await supabase
        .from("request_analysis")
        .select("*")
        .eq("request_id", request_id);

      if (cached && cached.length > 0) {
        const row = cached[0];
        const detected = row.detected_subjects || [];
        
        // Ensure status is open
        await supabase
          .from("student_requests")
          .update({ status: "open" })
          .eq("id", request_id);

        return res.status(200).json({
          field: detected[0] || "",
          sub_field: detected[1] || "",
          keywords: row.extracted_keywords || [],
          summary: row.summary || "",
          difficulty_level: row.difficulty_level || "intermediate",
          cached: true,
        });
      }
    }

    // 2. EXTRACT TEXT USING PDF-PARSE
    const startTime = Date.now();
    const pdfData = await pdfParse(file.buffer);
    const text = pdfData.text || "";

    // 3. ANALYZE WITH LLM
    let analysis;
    try {
      analysis = await analyzeWithLLM(text);
    } catch (llmErr) {
      console.error("[LLM ERROR]", llmErr.message);
      return res.status(502).json({ error: "Model did not return valid JSON or API failed" });
    }

    const field = analysis.field || "";
    const sub_field = analysis.sub_field || "";
    const keywords = Array.isArray(analysis.keywords) ? analysis.keywords : [];
    const summary = analysis.summary || "";
    const difficulty_level = analysis.difficulty_level || "intermediate";
    const processing_ms = Date.now() - startTime;

    // 4. SAVE TO DB + TRIGGER MATCH
    if (request_id) {
      const { data: check } = await supabase
        .from("request_analysis")
        .select("id")
        .eq("request_id", request_id);

      if (!check || check.length === 0) {
        await supabase.from("request_analysis").insert([
          {
            request_id,
            extracted_keywords: keywords,
            detected_subjects: [field, sub_field],
            difficulty_level,
            summary,
            embedding: new Array(1536).fill(0), // Placeholder
            model_used: "openrouter/owl-alpha",
            processing_ms,
          },
        ]);

        await supabase
          .from("student_requests")
          .update({ status: "open" })
          .eq("id", request_id);

        // Call the match endpoint internally
        const internalSecret = process.env.INTERNAL_MATCH_SECRET || "aidemy_internal_match";
        const port = process.env.PORT || 3000;
        
        // Send a fire-and-forget request to the internal match endpoint
        axios.post(`http://localhost:${port}/api/student/match/${request_id}`, {
          field,
          sub_field,
          secret: internalSecret
        }).catch(err => console.error("[INTERNAL MATCH] error:", err.message));
      }
    }

    return res.status(200).json({
      field,
      sub_field,
      keywords,
      summary,
      difficulty_level,
      cached: false,
    });

  } catch (err) {
    console.error("[NATIVE AI] Error:", err.message);
    return res.status(500).json({ error: "AI service failed to process PDF." });
  }
});

module.exports = router;

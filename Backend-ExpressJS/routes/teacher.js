const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabase");
const axios = require("axios");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-material", upload.single("file"), async (req, res) => {
  try {
    const { studentId, description, materialType } = req.body;

    const fileName = `${studentId}_${Date.now()}.pdf`;
    const { error: storageError } = await supabase.storage
      .from("teacher-materials")
      .upload(fileName, req.file.buffer, { contentType: "application/pdf" });

    if (storageError) throw storageError;

    const { data: publicUrlData } = supabase.storage
      .from("teacher-materials")
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;
    const idPdf = Date.now();

    const { error: uploadError } = await supabase
      .from("upload-pdf")
      .insert([{
        "id-student": studentId,
        "pdf-url": pdfUrl,
        specialties: description || null,
        "id-pdf": idPdf,
      }]);

    if (uploadError) throw uploadError;

    res.json({ success: true, pdfUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/offers/:teacherId", async (req, res) => {
  try {
    const { data: offers, error: offersError } = await supabase
      .from("upload-pdf")
      .select("*");

    if (offersError) throw offersError;

    res.json(offers);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get offers" });
  }
});

router.post("/accept-offer", async (req, res) => {
  try {
    const { offerId, price } = req.body;

    const { error } = await supabase
      .from("offer-teacher")
      .update({ "accept or not": "accepted" })
      .eq("id-pdf", offerId);

    if (error) throw error;

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to accept offer" });
  }
});

// POST summarize PDF from URL
router.post("/summarize-pdf", async (req, res) => {
  try {
    const { pdfUrl } = req.body;

    const aiResponse = await axios.post(
      "http://127.0.0.1:8000/summarize-from-url",
      { pdfUrl }
    );

    res.json(aiResponse.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Summarization failed" });
  }
});

module.exports = router;
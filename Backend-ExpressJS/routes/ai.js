import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/analyze-pdf", upload.single("file"), async (req, res) => {
  try {

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    const response = await axios.post(
      "http://127.0.0.1:8000/analyze-pdf",
      formData,
      { headers: formData.getHeaders() }
    );

    res.json(response.data);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "AI processing failed" });
  }
});

export default router;
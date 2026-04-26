const uploadMaterialController = async (req, res) => {
  const { uploadMaterial } = require("../services/teacherService");
  try {
    const { studentId, description, materialType } = req.body;
    const file = req.file;

    if (!file || !studentId) {
      return res.status(400).json({ error: "File and studentId are required." });
    }

    const result = await uploadMaterial(studentId, description, materialType, file);
    return res.json({ success: true, pdfUrl: result.pdfUrl });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Upload failed" });
  }
};

const getOffersController = async (req, res) => {
  const { getOffers } = require("../services/teacherService");
  try {
    const { teacherId } = req.params;
    const offers = await getOffers(teacherId);
    return res.json(offers);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get offers" });
  }
};

const acceptOfferController = async (req, res) => {
  const { acceptOffer } = require("../services/teacherService");
  try {
    const { offerId, price } = req.body;

    if (!offerId) {
      return res.status(400).json({ error: "offerId is required." });
    }

    await acceptOffer(offerId, price);
    return res.json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to accept offer" });
  }
};

const summarizePdfController = async (req, res) => {
  const { summarizePdf } = require("../services/teacherService");
  try {
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: "pdfUrl is required." });
    }

    const result = await summarizePdf(pdfUrl);
    return res.json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Summarization failed" });
  }
};

module.exports = {
  uploadMaterialController,
  getOffersController,
  acceptOfferController,
  summarizePdfController
};
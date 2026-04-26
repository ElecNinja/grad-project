const express = require("express");
const multer = require("multer");
const { isAuthenticated, isTeacher } = require("../middleware/authMiddleware");

const ctrl = require("../controllers/teacherController");

console.log("ctrl keys:", Object.keys(ctrl));
console.log("uploadMaterialController:", ctrl.uploadMaterialController);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-material", isAuthenticated, upload.single("file"), ctrl.uploadMaterialController);
router.get("/offers/:teacherId", isAuthenticated, isTeacher, ctrl.getOffersController);
router.post("/accept-offer", isAuthenticated, isTeacher, ctrl.acceptOfferController);
router.post("/summarize-pdf", isAuthenticated, ctrl.summarizePdfController);

module.exports = router;
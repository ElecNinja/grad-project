const express = require("express");
const router = express.Router();
const multer = require("multer");
const { isAuthenticated } = require("../middleware/authMiddleware");
const teacherController = require("../controllers/teacherController");

// Multer in memory — file goes to req.file.buffer
const upload = multer({ storage: multer.memoryStorage() });


router.post("/upload-material", isAuthenticated, upload.single("file"), teacherController.uploadMaterial);
router.get("/offers/:teacherId", isAuthenticated, teacherController.getOffers);
router.get("/accepted-offers", isAuthenticated, teacherController.getAcceptedOffersTeacher);
router.post("/accept-offer", isAuthenticated, teacherController.acceptOffer);
router.post("/summarize-pdf", isAuthenticated, teacherController.summarizePdf);
router.get("/list", isAuthenticated, teacherController.listTeachers);


router.get("/profile/:id", isAuthenticated, teacherController.getTeacherProfile);
router.put("/profile", isAuthenticated, upload.single("photo"), teacherController.updateTeacherProfile);

router.get("/student/profile/:id", isAuthenticated, teacherController.getStudentProfile);
router.put("/student/profile", isAuthenticated, upload.single("photo"), teacherController.updateStudentProfile);

router.get("/requests", isAuthenticated, teacherController.getRequestsController);
router.post("/accept-request", isAuthenticated, teacherController.acceptRequestController);

// Course content routes
router.post("/upload-content", isAuthenticated, upload.single("file"), teacherController.uploadCourseContent);
router.get("/course-content/:bidId", isAuthenticated, teacherController.getCourseContent);

module.exports = router;
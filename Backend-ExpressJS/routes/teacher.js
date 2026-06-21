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
router.get("/profile/:id/reviews", isAuthenticated, teacherController.getTeacherReviews);
router.get("/profile/:id/recommended", isAuthenticated, teacherController.getRecommendedTeachers);
router.put(
  "/profile",
  isAuthenticated,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  teacherController.updateTeacherProfile
);

router.get("/subjects", isAuthenticated, teacherController.listSubjects);

router.get("/student/profile/:id", isAuthenticated, teacherController.getStudentProfile);
router.put("/student/profile", isAuthenticated, upload.single("photo"), teacherController.updateStudentProfile);

router.get("/requests", isAuthenticated, teacherController.getRequestsController);
router.post("/accept-request", isAuthenticated, teacherController.acceptRequestController);

// Course content routes
router.post("/upload-content", isAuthenticated, upload.single("file"), teacherController.uploadCourseContent);
router.get("/course-content/:bidId", isAuthenticated, teacherController.getCourseContent);

// Teacher uploads a video for a specific student (Work.jsx "Upload and Publish")
router.post("/upload-video", isAuthenticated, teacherController.uploadTeacherVideoController);

const publicBootcampController = require("../controllers/publicBootcampController");

// Create a bootcamp with its first section + that section's videos
router.post(
  "/public-bootcamps",
  isAuthenticated,
  upload.single("image"),
  publicBootcampController.createPublicBootcampController
);
// Add a new section (e.g. "CSS", "JavaScript") to an existing bootcamp
router.post(
  "/public-bootcamps/:bootcampId/sections",
  isAuthenticated,
  publicBootcampController.addSectionController
);

// Add a video under an existing section
router.post(
  "/public-bootcamps/:bootcampId/sections/:sectionId/videos",
  isAuthenticated,
  publicBootcampController.addVideoController
);

// Convert a private/single-student bootcamp into a public, capacity-limited one
router.post(
  "/public-bootcamps/:bootcampId/make-public",
  isAuthenticated,
  publicBootcampController.makeBootcampPublicController
);

// Get a teacher's public bootcamps (for TeacherProfileView page - students browsing)
router.get(
  "/profile/:id/bootcamps",
  isAuthenticated,
  teacherController.getTeacherPublicBootcamps
);

module.exports = router;
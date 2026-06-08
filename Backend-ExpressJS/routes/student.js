const express = require("express");
const router = express.Router();
const multer = require("multer");
const { isAuthenticated } = require("../middleware/authMiddleware");
const { createRequest, getMyRequests, getAcceptedOffers } = require("../controllers/studentController");

const upload = multer({ storage: multer.memoryStorage() });

// Student creates a new request
router.post("/request", isAuthenticated, upload.single("file"), createRequest);

// Student gets their own requests
router.get("/requests", isAuthenticated, getMyRequests);

// Student gets their accepted offers (courses/bootcamps)
router.get("/accepted-offers", isAuthenticated, getAcceptedOffers);

module.exports = router;
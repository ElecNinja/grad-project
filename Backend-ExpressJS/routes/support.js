// Backend-ExpressJS/routes/support.js
const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const { createSupportTicket, getMySupportTickets } = require("../controllers/supportController");

// Create support ticket (public / optional auth handled in controller)
router.post("/ticket", createSupportTicket);

// Get my support tickets (requires login)
router.get("/my-tickets", isAuthenticated, getMySupportTickets);

module.exports = router;

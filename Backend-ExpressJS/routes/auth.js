const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  me
} = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, me);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  getMe // ✅ added
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getMe); // ✅ added

module.exports = router;
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const supabase = require('../config/supabase');

router.post("/login", async (req, res) => {

  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Invalid input"
    });
  }

  try {

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("role", role)   
      .single();

    if (error || !user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Wrong password"
      });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});

module.exports = router;
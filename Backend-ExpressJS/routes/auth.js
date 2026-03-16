const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const supabase = require("../config/supabase");

const router = express.Router();


// ============================
// POST /api/signup
// ============================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, about, photo, role, education, experience } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    if (!role || !["student", "teacher"].includes(role)) {
      return res.status(400).json({ error: "Role must be student or teacher." });
    }

    const table = role === "teacher" ? "signup-teachers" : "signup-students";

    // check if email already exists
    const { data: existing } = await supabase
      .from("login-users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==========================
    // 1 create login user first
    // ==========================
    const { data: loginUser, error: loginError } = await supabase
      .from("login-users")
      .insert([
        {
          email,
          password: hashedPassword,
          role,
        },
      ])
      .select("id")
      .single();

    if (loginError) {
      console.error("login-users insert error:", loginError);
      return res.status(500).json({ error: "Could not create login account." });
    }

    // ==========================
    // 2 create profile
    // ==========================
    const record =
      role === "teacher"
        ? {
            id: loginUser.id,
            name,
            email,
            phone: phone || null,
            education: education || null,
            experience: experience || null,
            photo: photo || null,
            role: "teacher",
          }
        : {
            id: loginUser.id,
            name,
            email,
            phone: phone || null,
            about: about || null,
            photo: photo || null,
            role: "student",
          };

    const { data: newUser, error } = await supabase
      .from(table)
      .insert([record])
      .select("id, name, email, role")
      .single();

    if (error) {
      console.error("profile insert error:", error);
      return res.status(500).json({ error: "Could not create profile." });
    }

    return res.status(201).json({
      message: `${role} account created successfully`,
      user: newUser,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});


// ============================
// POST /api/login
// ============================
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Server error." });

    if (!user) {
      return res.status(401).json({
        error: info?.message || "Login failed",
      });
    }

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: "Session error." });

      const { password, ...safeUser } = user;

      return res.json({
        message: "Logged in successfully",
        user: safeUser,
      });
    });
  })(req, res, next);
});


// ============================
// GET /api/me
// ============================
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});


// ============================
// POST /api/logout
// ============================
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    req.session.destroy();

    return res.json({ message: "Logged out" });
  });
});


// ============================
// DELETE /api/deleteMe
// ============================
router.delete("/deleteMe", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const table =
      req.user.role === "teacher" ? "signup-teachers" : "signup-students";

    await supabase.from(table).delete().eq("id", req.user.id);

    await supabase.from("login-users").delete().eq("id", req.user.id);

    req.logout(() => {});
    req.session.destroy();

    return res.json({ message: "Account deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
// ===============================
// Import required packages
// ===============================
const passport = require("passport");
const { validateSignup, validateLogin } = require("../utils/validation");

// Import auth services
const {
  checkExistingEmail,
  createLoginAccount,
  createProfile
} = require("../services/authService");

// ===============================
// SIGNUP CONTROLLER
// ===============================
const signup = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      about, photo, role, education, experience
    } = req.body;

    // Validate all signup inputs
    const check = validateSignup(name, email, password, role);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    // Check if email already exists
    const existing = await checkExistingEmail(email);
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Email already exists." });
    }

    // Create login account
    const { data: loginUser, error: loginError } =
      await createLoginAccount(email, password, role);

    if (loginError) {
      return res.status(500).json({ error: "Could not create login account." });
    }

    // Create student/teacher profile
    const { data: newUser, error: signupError } =
      await createProfile(
        loginUser.id, name, email, phone,
        about, photo, role, education, experience
      );

    if (signupError) {
      return res.status(500).json({ error: "Could not create profile." });
    }

    return res.status(201).json({
      message: `${role} account created successfully`,
      user: newUser
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

// ===============================
// LOGIN CONTROLLER
// ===============================
const login = (req, res, next) => {
  const { email, password } = req.body;

  // Validate login inputs
  const check = validateLogin(email, password);
  if (!check.valid) {
    return res.status(400).json({ error: check.error });
  }

  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: "Server error." });
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || "Login failed" });
    }

    req.logIn(user, async (err) => {
      if (err) {
        return res.status(500).json({ error: "Session error." });
      }

      // Remove password before response
      const { password, ...safeUser } = user;

      return res.json({
        message: "Logged in successfully",
        user: safeUser
      });
    });
  })(req, res, next);
};

// ===============================
// LOGOUT CONTROLLER
// ===============================
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    // Destroy current session
    req.session.destroy();

    return res.json({ message: "Logged out" });
  });
};

// ===============================
// Export controllers
// ===============================
module.exports = {
  signup,
  login,
  logout
};
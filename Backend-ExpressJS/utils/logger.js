const passport = require("passport");
const { validateSignup, validateLogin } = require("../utils/validation");
const log = require("../utils/logger");

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
      log.warn(`Signup failed - validation error: ${check.error}`);
      return res.status(400).json({ error: check.error });
    }

    // Check if email already exists
    const existing = await checkExistingEmail(email);
    if (existing && existing.length > 0) {
      log.warn(`Signup failed - email already exists: ${email}`);
      return res.status(409).json({ error: "Email already exists." });
    }

    // Create login account
    const { data: loginUser, error: loginError } =
      await createLoginAccount(email, password, role);

    if (loginError) {
      log.error(`Signup failed - could not create login account: ${email}`);
      return res.status(500).json({ error: "Could not create login account." });
    }

    // Create student/teacher profile
    const { data: newUser, error: signupError } =
      await createProfile(
        loginUser.id, name, email, phone,
        about, photo, role, education, experience
      );

    if (signupError) {
      log.error(`Signup failed - could not create profile: ${email}`);
      return res.status(500).json({ error: "Could not create profile." });
    }

    log.success(`New ${role} signed up: ${email}`);
    return res.status(201).json({
      message: `${role} account created successfully`,
      user: newUser
    });

  } catch (err) {
    log.error(`Signup error: ${err.message}`);
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
    log.warn(`Login failed - validation error: ${check.error}`);
    return res.status(400).json({ error: check.error });
  }

  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      log.error(`Login error: ${err.message}`);
      return res.status(500).json({ error: "Server error." });
    }
    if (!user) {
      log.warn(`Login failed - invalid credentials: ${email}`);
      return res.status(401).json({ error: info?.message || "Login failed" });
    }

    req.logIn(user, async (err) => {
      if (err) {
        log.error(`Session error: ${err.message}`);
        return res.status(500).json({ error: "Session error." });
      }

      const { password, ...safeUser } = user;
      log.success(`User logged in: ${email} (${user.role})`);

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
  const email = req.user?.email || "unknown";

  req.logout((err) => {
    if (err) {
      log.error(`Logout error: ${err.message}`);
      return res.status(500).json({ error: "Logout failed" });
    }

    req.session.destroy();
    log.info(`User logged out: ${email}`);
    return res.json({ message: "Logged out" });
  });
};

module.exports = { signup, login, logout };
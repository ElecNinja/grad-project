const { validateSignup, validateLogin } = require("../utils/validation");
const log = require("../utils/logger");

const {
  updateProfile,
  createTeacherProfile,
  getProfileById,
} = require("../services/authService");

const supabase = require("../config/supabase");

// ===============================
// SIGNUP CONTROLLER
// ===============================
const signup = async (req, res) => {
  try {
    const { userId, name, email, phone, about, photo, role, education, experience, subject } = req.body;    
    // Validate input fields
    const check = validateSignup(name, email, "temporaryPassword", role);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    // Must have Supabase auth user already
    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    // Update profile row created automatically by Supabase trigger
    const { data: profile, error: profileError } = await updateProfile(userId, {
      full_name: name,
      email,
      role,
      bio: subject || about || null, 
      avatar_url: photo || null,
    });

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
      return res.status(500).json({
        error: "Could not update profile.",
        details: profileError.message,
      });
    }

    // Create teacher profile if role is teacher
    if (role === "teacher") {
      const { error: teacherError } = await createTeacherProfile(userId, {
        headline: about || null,
        years_experience: experience ? parseInt(experience) : null,
        teaching_languages: ["English"],
      });

      if (teacherError) {
        console.error(teacherError);
      }
    }

    console.log(`New ${role} signed up: ${email}`);

    return res.status(201).json({
      message: "Signup successful",
      user: profile,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error.", details: err.message });
  }
};

// ===============================
// LOGIN CONTROLLER
// ===============================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    const check = validateLogin(email, password);
    if (!check.valid) {
      console.warn(`Login failed - validation: ${check.error}`);
      return res.status(400).json({ error: check.error });
    }

    // Sign in via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.warn(`Login failed - invalid credentials: ${email}`);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // ---- 3. Fetch profile from your DB ----
    const { data: profile, error: profileError } = await getProfileById(data.user.id);

    if (profileError) {
      console.error(`Login failed - profile fetch: ${profileError.message}`);
      return res.status(500).json({ error: "Could not fetch profile." });
    }

    console.log(`User logged in: ${email} (${profile.role})`);

    // Return token + profile; the frontend stores the token for subsequent API calls.
    return res.json({
      message: "Logged in successfully",
      token: data.session.access_token,
      user: profile,
    });

  } catch (err) {
    console.error(`Login error: ${err.message}`);
    return res.status(500).json({ error: "Server error." });
  }
};

// ===============================
// LOGOUT CONTROLLER
// ===============================
const logout = async (req, res) => {
  try {
    log.info(`User logged out`);
    return res.json({ message: "Logged out" });

  } catch (err) {
    console.error(`Logout error: ${err.message}`);
    return res.status(500).json({ error: "Logout failed" });
  }
};

const me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    return res.json({ user: req.user });
  } catch (err) {
    console.error(`Me error: ${err.message}`);
    return res.status(500).json({ error: "Server error." });
  }
};

module.exports = { signup, login, logout, me };
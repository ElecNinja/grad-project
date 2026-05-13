// ===============================
// authController.js
// ===============================
const { validateSignup, validateLogin } = require("../utils/validation");
const log = require("../utils/logger");
// Note: passport removed — auth is now handled by Supabase Auth

const {
  checkExistingEmail,
  createLoginAccount,
  updateProfile,
  createTeacherProfile,
} = require("../services/authService");

const supabase = require("../config/supabase");

// ===============================
// SIGNUP CONTROLLER
// ===============================
const signup = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      about, photo, role,
      education, experience,
    } = req.body;

    // ---- 1. Validate inputs ----
    const check = validateSignup(name, email, password, role);
    if (!check.valid) {
      log.warn(`Signup failed - validation: ${check.error}`);
      return res.status(400).json({ error: check.error });
    }

    // ---- 2. Check email not taken ----
    const existing = await checkExistingEmail(email);
    if (existing && existing.length > 0) {
      log.warn(`Signup failed - email exists: ${email}`);
      return res.status(409).json({ error: "Email already exists." });
    }

    // ---- 3. Create Supabase Auth user ----
    // This also fires the DB trigger that creates the profiles row
    const { data: authData, error: authError } =
      await createLoginAccount(email, password, name, role);

    if (authError) {
      log.error(`Signup failed - auth error: ${authError.message}`);
      return res.status(500).json({ error: "Could not create account." });
    }

    const userId = authData.user.id;

    // ---- 4. Update the profile the trigger already created ----
    // Trigger sets: id, email, full_name, avatar_url
    // We add: role, phone (bio), avatar_url (photo URL from frontend)
    const { data: profile, error: profileError } = await updateProfile(userId, {
      role,
      bio: about || null,
      avatar_url: photo || null,
    });

    if (profileError) {
      log.error(`Signup failed - profile update: ${profileError.message}`);
      // Auth user was created — don't leave orphan, attempt cleanup
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: "Could not save profile." });
    }

    // ---- 5. If teacher, create teacher_profiles row ----
    if (role === "teacher") {
      const { error: teacherError } = await createTeacherProfile(userId, {
        headline: about || null,
        years_experience: experience ? parseInt(experience) || null : null,
        teaching_languages: ["English"],
      });

      if (teacherError) {
        log.error(`Signup failed - teacher profile: ${teacherError.message}`);
        // Profile exists, just teacher_profiles failed — still return success
        // but log it so you can fix manually or retry
        log.warn(`Teacher profile not created for ${userId} — needs manual fix`);
      }
    }

    log.success(`New ${role} signed up: ${email}`);
    return res.status(201).json({
      message: `${role} account created successfully`,
      user: profile,
    });

  } catch (err) {
    log.error(`Signup error: ${err.message}`);
    return res.status(500).json({ error: "Server error." });
  }
};

// ===============================
// LOGIN CONTROLLER
// Uses Supabase Auth — no passport
// No session — returns JWT token
// ===============================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---- 1. Validate inputs ----
    const check = validateLogin(email, password);
    if (!check.valid) {
      log.warn(`Login failed - validation: ${check.error}`);
      return res.status(400).json({ error: check.error });
    }

    // ---- 2. Sign in via Supabase Auth ----
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      log.warn(`Login failed - invalid credentials: ${email}`);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // ---- 3. Fetch profile from your DB ----
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, is_verified")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      log.error(`Login failed - profile fetch: ${profileError.message}`);
      return res.status(500).json({ error: "Could not fetch profile." });
    }

    log.success(`User logged in: ${email} (${profile.role})`);

    // Return token + profile
    // Frontend stores the access_token in memory or httpOnly cookie
    return res.json({
      message: "Logged in successfully",
      token: data.session.access_token,
      user: profile,
    });

  } catch (err) {
    log.error(`Login error: ${err.message}`);
    return res.status(500).json({ error: "Server error." });
  }
};

// ===============================
// LOGOUT CONTROLLER
// ===============================
const logout = async (req, res) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      // Tell Supabase to invalidate this session
      await supabase.auth.admin.signOut(token);
    }

    log.info(`User logged out`);
    return res.json({ message: "Logged out" });

  } catch (err) {
    log.error(`Logout error: ${err.message}`);
    return res.status(500).json({ error: "Logout failed" });
  }
};

module.exports = { signup, login, logout };
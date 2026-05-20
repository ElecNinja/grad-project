const { validateSignup, validateLogin } = require("../utils/validation");
const log = require("../utils/logger");

const {
  checkExistingEmail,
  updateProfile,
  createTeacherProfile,
} = require("../services/authService");

const supabase = require("../config/supabase");

// ===============================
// SIGNUP CONTROLLER
// ===============================
const signup = async (req, res) => {
  try {
    const { userId, name, email, phone, about, photo, role, education, experience, subject } = req.body;

    const check = validateSignup(name, email, "temporaryPassword", role);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId." });
    }

    // Update profile row
    const { data: profile, error: profileError } = await updateProfile(userId, {
      full_name: name,
      email,
      role,
      bio: about || null,
      avatar_url: photo || null,
    });

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
      return res.status(500).json({ error: "Could not update profile.", details: profileError.message });
    }

    // Create teacher profile and link subject
    if (role === "teacher") {
      const { data: teacherProfile, error: teacherError } = await createTeacherProfile(userId, {
        headline: about || null,
        years_experience: experience ? parseInt(experience) : null,
        teaching_languages: ["English"],
      });

      if (teacherError) {
        console.error("TEACHER PROFILE ERROR:", teacherError);
      }

      // Save subject in teacher_subjects table
      if (subject && teacherProfile) {
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id')
          .ilike('name', subject.trim())
          .single();

        if (subjectData) {
          const { error: subjectError } = await supabase
            .from('teacher_subjects')
            .insert([{
              teacher_id: teacherProfile.id,
              subject_id: subjectData.id,
              proficiency: 'intermediate',
            }]);

          if (subjectError) {
            console.error("SUBJECT LINK ERROR:", subjectError);
          } else {
            console.log(`Teacher linked to subject: ${subject}`);
          }
        } else {
          console.log(`Subject not found in DB: ${subject}`);
        }
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

    // Fetch profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, is_verified")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error(`Login failed - profile fetch: ${profileError.message}`);
      return res.status(500).json({ error: "Could not fetch profile." });
    }

    console.log(`User logged in: ${email} (${profile.role})`);

    // Return token and profile data to frontend
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
    // Get token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      // Invalidate session in Supabase
      await supabase.auth.admin.signOut(token);
    }

    log.info(`User logged out`);
    return res.json({ message: "Logged out" });

  } catch (err) {
    console.error(`Logout error: ${err.message}`);
    return res.status(500).json({ error: "Logout failed" });
  }
};

// ===============================
// GET CURRENT USER CONTROLLER
// ===============================
const getMe = async (req, res) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });

    // Fetch profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: "Could not fetch profile." });
    }

    return res.json({ user: profile });

  } catch (err) {
    console.error(`GetMe error: ${err.message}`);
    return res.status(500).json({ error: "Server error." });
  }
};

module.exports = { signup, login, logout, getMe };
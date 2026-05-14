const supabase = require("../config/supabase");

// ======================================
// Check if user is logged in via JWT token
// ======================================
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized. Invalid token." });
    }

    // Fetch profile to get role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", user.id)
      .single();

    // Attach user to request for use in controllers
    req.user = profile;
    return next();

  } catch (err) {
    return res.status(401).json({ error: "Unauthorized." });
  }
};

// ======================================
// Check if user is Teacher
// ======================================
const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === "teacher") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Teachers only." });
};

// ======================================
// Check if user is Student
// ======================================
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    return next();
  }
  return res.status(403).json({ error: "Access denied. Students only." });
};

// ======================================
// Export middleware
// ======================================
module.exports = {
  isAuthenticated,
  isTeacher,
  isStudent
};
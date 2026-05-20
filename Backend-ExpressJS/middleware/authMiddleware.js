const supabase = require("../config/supabase");
const { getProfileById } = require("../services/authService");

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header) {
    return null;
  }

  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return header.trim();
};

// ======================================
// Check if user is logged in
// ======================================
const isAuthenticated = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user?.id) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    const { data: user, error: profileError } = await getProfileById(data.user.id);

    if (profileError || !user) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({ error: "Failed to validate user session." });
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
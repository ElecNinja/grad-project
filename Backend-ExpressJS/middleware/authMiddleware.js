// ======================================
// Check if user is logged in
// ======================================
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized. Please login first." });
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
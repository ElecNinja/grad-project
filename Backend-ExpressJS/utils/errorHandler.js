// ======================================
// Global error handler middleware
// ======================================
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);

  // Validation error
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  // Unauthorized
  if (err.status === 401) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  // Forbidden
  if (err.status === 403) {
    return res.status(403).json({ error: "Access denied." });
  }

  // Not found
  if (err.status === 404) {
    return res.status(404).json({ error: "Resource not found." });
  }

  // Default server error
  return res.status(500).json({ error: "Internal server error." });
};

// ======================================
// 404 handler for unknown routes
// ======================================
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found.` });
};

module.exports = { errorHandler, notFound };
// ======================================
// Sanitize input - remove dangerous chars
// ======================================
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === "string") {
        // Remove HTML tags and trim whitespace
        obj[key] = obj[key].replace(/<[^>]*>/g, "").trim();
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// ======================================
// Prevent too many requests (simple rate limiter)
// ======================================
const requestCounts = {};

const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, startTime: now };
    return next();
  }

  const elapsed = now - requestCounts[ip].startTime;

  if (elapsed > windowMs) {
    // Reset window
    requestCounts[ip] = { count: 1, startTime: now };
    return next();
  }

  requestCounts[ip].count++;

  if (requestCounts[ip].count > maxRequests) {
    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  next();
};

module.exports = { sanitizeInput, rateLimiter };
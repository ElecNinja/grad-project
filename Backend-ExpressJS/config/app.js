require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const teacherRouter = require('../routes/teacher');
const studentRouter = require('../routes/student');
// ─── NEW: import chat routes ──────────────────────────────
const chatRoutes = require('../routes/chat');
const supportRoutes = require('../routes/support');

const { sanitizeInput, rateLimiter } = require("../middleware/securityMiddleware");
const { errorHandler, notFound } = require("../utils/errorHandler");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://grad-project-eta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(rateLimiter);
app.use(sanitizeInput);

// ─── Routes ──────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/teacher', teacherRouter);
app.use('/api/student', studentRouter);
app.use('/api/chat', chatRoutes);   // ← ADD THIS LINE
app.use('/api/support', supportRoutes);

// Handle unknown routes
app.use(notFound);
// Global error handler
app.use(errorHandler);

module.exports = app;
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const teacherRouter = require('../routes/teacher');
const studentRouter = require('../routes/student');
// ─── NEW: import chat routes ──────────────────────────────
const chatRoutes = require('../routes/chat');
const supportRoutes = require('../routes/support');
const savedTeachersRouter = require('../routes/savedTeachers');
const communityRouter = require('../routes/community');
const bootcampCategoriesRouter = require('../routes/bootcampCategories');

const { sanitizeInput, rateLimiter } = require("../middleware/securityMiddleware");
const { errorHandler, notFound } = require("../utils/errorHandler");

const app = express();

const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://grad-project-eta.vercel.app",
  ...configuredOrigins
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowedVercelPreview = /^https:\/\/grad-project(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

    if (allowedOrigins.includes(origin) || isAllowedVercelPreview) {
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
app.use('/api/saved-teachers', savedTeachersRouter);
app.use('/api/community', communityRouter);
app.use('/api/bootcamps/categories', bootcampCategoriesRouter);

// Handle unknown routes
app.use(notFound);
// Global error handler
app.use(errorHandler);

module.exports = app;

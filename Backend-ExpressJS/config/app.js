require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const teacherRouter = require('../routes/teacher');
const studentRouter = require('../routes/student');
const aiRouter = require('../routes/ai'); // ✅ AI proxy
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

app.use('/api', authRoutes);
app.use('/api/teacher', teacherRouter);
app.use('/api/student', studentRouter);
app.use('/api/ai', aiRouter); // ✅ AI proxy — forwards to FastAPI

// Handle unknown routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
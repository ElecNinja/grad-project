require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const teacherRouter = require('../routes/teacher');
const { sanitizeInput, rateLimiter } = require("../middleware/securityMiddleware");
const { errorHandler, notFound } = require("../utils/errorHandler");

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(rateLimiter);
app.use(sanitizeInput);

app.use('/api', authRoutes);
app.use('/api/teacher', teacherRouter);

// Handle unknown routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
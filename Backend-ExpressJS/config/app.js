// Backend-ExpressJS/src/config/app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const initializePassport = require('./passport-config');
const authRoutes = require('../routes/auth');


const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session (بدون MongoDB - in-memory)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, 
  }
}));

// Passport
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', authRoutes);

module.exports = app;
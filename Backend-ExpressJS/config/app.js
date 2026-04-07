const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const initializePassport = require('./passport-config');
const authRoutes = require('../routes/auth');
const teacherRouter = require('../routes/teacher');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', authRoutes);
app.use('/api/teacher', teacherRouter);

module.exports = app;
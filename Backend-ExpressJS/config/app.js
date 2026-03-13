require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./passport-config');
const supabase = require('./supabase'); // ✅ اتنقل للأول

const app = express();

console.log(supabase) // ✅ دلوقتي شغال

initializePassport(passport);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: null
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

const authRoutes = require('../routes/auth');
app.use('/api', authRoutes);

module.exports = app;
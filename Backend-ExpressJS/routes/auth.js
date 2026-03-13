const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const supabase = require('../config/supabase');
const checkAuthenticated = require('../middleware/authMiddleware');
const { INPUT_LENGTH } = require('../utils/constants.js');

// Signup
router.post('/signup', async (req, res) => {
  console.log('📦 Request body:', req.body);
  const { name, email, password, role } = req.body;
  console.log(`New signup requested: ${email}.`);

  try {
    if (!name || name.length < INPUT_LENGTH.name.minValue || name.length > INPUT_LENGTH.name.maxValue) {
      return res.status(400).json({ error: `Name must be between ${INPUT_LENGTH.name.minValue} and ${INPUT_LENGTH.name.maxValue} characters.` });
    }
    if (!email || !email.includes('@') || email.length < INPUT_LENGTH.email.minValue || email.length > INPUT_LENGTH.email.maxValue) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (!password || password.length < INPUT_LENGTH.password.minValue || password.length > INPUT_LENGTH.password.maxValue) {
      return res.status(400).json({ error: `Password must be between ${INPUT_LENGTH.password.minValue} and ${INPUT_LENGTH.password.maxValue} characters.` });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPw = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPw, role: role || 'student' }]);

    if (error) throw error;

    const { data: newUser } = await supabase
      .from('users').select('id').eq('email', email).single();

    if (role === 'student') {
      await supabase.from('students')
        .insert([{ name, email, password: hashedPw, "id-student": newUser.id }]);
    }

    if (role === 'expert') {
      await supabase.from('teachers')
        .insert([{ name, email, password: hashedPw, id: newUser.id }]);
    }

    console.log(`New signup: ${email}.`);
    return res.status(201).json({ message: 'User created successfully. Please log in.' });
  } catch (err) {
    console.error(`New signup failed: ${err}`);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Login
router.post('/login', (req, res, next) => {
  console.log("Login requested");
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }
      console.log(`New login.`);
      return res.status(200).json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    });
  })(req, res, next);
});

// Logout
router.post('/logout', checkAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

// Get current user
router.get('/me', checkAuthenticated, (req, res) => {
  const { name, email } = req.user;
  res.status(200).json({ authenticated: true, user: { name, email } });
});

// Delete account
router.delete('/deleteMe', checkAuthenticated, async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (error) throw error;

    req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Error during logout.' });
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Account deleted and logged out successfully.' });
      });
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return res.status(500).json({ error: 'Something went wrong while deleting your account.' });
  }
});

module.exports = router;
// Backend-ExpressJS/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const supabase = require('../config/supabase');

const router = express.Router();

// ============================
// POST /api/signup-student
// ============================
router.post('/signup-student', async (req, res) => {
  try {
    const { name, email, password, phone, about, photo, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const { data: existing } = await supabase
      .from('signup-students')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('signup-students')
      .insert([{
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        about: about || null,
        photo: photo || null,
        role: role || 'student',
      }])
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Could not create student account.' });
    }

    return res.status(201).json({
      message: 'Student account created successfully.',
      user: { name: newUser.name, email: newUser.email }
    });

  } catch (err) {
    console.error('Signup-student error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ============================
// POST /api/signup-teacher
// ============================
router.post('/signup-teacher', async (req, res) => {
  try {
    const { name, email, password, phone, education, experience, photo, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const { data: existing } = await supabase
      .from('signup-teachers')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newTeacher, error } = await supabase
      .from('signup-teachers')
      .insert([{
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        education: education || null,
        experience: experience || null,
        photo: photo || null,
        role: role || 'teacher',
      }])
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Could not create teacher account.' });
    }

    return res.status(201).json({
      message: 'Teacher account created successfully.',
      user: { name: newTeacher.name, email: newTeacher.email }
    });

  } catch (err) {
    console.error('Signup-teacher error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ============================
// POST /api/login
// ============================
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'Server error.' });
    if (!user) return res.status(401).json({ error: info?.message || 'Login failed.' });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login session error.' });
      return res.status(200).json({
        message: 'Logged in successfully.',
        user: { name: user.name, email: user.email }
      });
    });
  })(req, res, next);
});

// ============================
// POST /api/me
// ============================
router.post('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.status(200).json({
    user: { name: req.user.name, email: req.user.email }
  });
});

// ============================
// POST /api/logout
// ============================
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    req.session.destroy();
    return res.status(200).json({ message: 'Logged out.' });
  });
});

// ============================
// DELETE /api/deleteMe
// ============================
router.delete('/deleteMe', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (error) return res.status(500).json({ error: 'Could not delete account.' });

    req.logout((err) => {
      if (err) console.error(err);
      req.session.destroy();
    });

    return res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
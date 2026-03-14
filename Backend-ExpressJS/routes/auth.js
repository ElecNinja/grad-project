const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const supabase = require('../config/supabase');

const router = express.Router();

// ============================
// POST /api/signup
// ============================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, about, photo, role, education, experience } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!role || (role !== 'student' && role !== 'teacher')) {
      return res.status(400).json({ error: 'Role must be student or teacher.' });
    }

    const table = role === 'teacher' ? 'signup-teachers' : 'signup-students';

    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const record = role === 'teacher'
      ? {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          education: education || null,
          experience: experience || null,
          photo: photo || null,
          role: 'teacher',
        }
      : {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          about: about || null,
          photo: photo || null,
          role: 'student',
        };

    const { data: newUser, error } = await supabase
      .from(table)
      .insert([record])
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Could not create account.' });
    }

    
    const { error: loginUserError } = await supabase
      .from('login-users')
      .insert([{
        email: newUser.email,
        password: hashedPassword,
        role: newUser.role,
      }]);

    if (loginUserError) {
      console.error('login-users insert error:', loginUserError);
    }

    return res.status(201).json({
      message: `${role === 'teacher' ? 'Teacher' : 'Student'} account created successfully.`,
      user: { name: newUser.name, email: newUser.email, role: newUser.role }
    });

  } catch (err) {
    console.error('Signup error:', err);
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

      const { password: _, ...safeUser } = user;

      return res.status(200).json({
        message: 'Logged in successfully.',
        user: safeUser
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
    user: { name: req.user.name, email: req.user.email, role: req.user.role }
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
    const table = req.user.role === 'teacher' ? 'signup-teachers' : 'signup-students';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', req.user.id);

    if (error) return res.status(500).json({ error: 'Could not delete account.' });

    
    await supabase
      .from('login-users')
      .delete()
      .eq('email', req.user.email);

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
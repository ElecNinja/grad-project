// routes/studentBootcampRoutes.js  (or add to your existing student routes file)
const express = require('express');
const router = express.Router();
const { enrollStudentInBootcamp } = require('../services/Publicbootcampservice');
// ⚠️ adjust this import to match your actual auth middleware name/path
const requireAuth = require('../middleware/requireAuth');

router.post('/api/student/bootcamps/:id/enroll', requireAuth, async (req, res) => {
  try {
    // ⚠️ adjust req.user.id to however your auth middleware stores the logged-in user id
    const studentId = req.user?.id;
    const bootcampId = req.params.id;

    if (!studentId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const result = await enrollStudentInBootcamp({ studentId, bootcampId });
    return res.status(200).json({ data: result, message: result.message });
  } catch (err) {
    console.error('Enroll error:', err);
    return res.status(400).json({ message: err.message || 'Failed to enroll' });
  }
});

module.exports = router;
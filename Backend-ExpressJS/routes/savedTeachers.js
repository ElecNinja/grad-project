const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { saveTeacher, getSavedTeachers, deleteSavedTeacher } = require('../controllers/savedTeachersController');

router.post('/', isAuthenticated, saveTeacher);
router.get('/', isAuthenticated, getSavedTeachers);
router.delete('/:teacherId', isAuthenticated, deleteSavedTeacher);

module.exports = router;

const { getStudentCourses, getStudentBootcamps } = require('../services/studentVideosService');
const teacherService = require('../services/teacherService');

// GET /api/student/videos/courses
async function getMyCourses(req, res) {
  try {
    const studentId = req.user.id; // injected by authMiddleware
    const courses = await getStudentCourses(studentId);
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    console.error('getMyCourses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
}

// GET /api/student/videos/bootcamps
async function getMyBootcamps(req, res) {
  try {
    const studentId = req.user.id;
    const bootcamps = await getStudentBootcamps(studentId);
    res.status(200).json({ success: true, data: bootcamps });
  } catch (err) {
    console.error('getMyBootcamps error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch bootcamps' });
  }
}

// GET /api/student/videos/uploaded
// Videos a teacher uploaded specifically for this student (Work.jsx flow)
async function getMyUploadedVideos(req, res) {
  try {
    const studentId = req.user.id;
    const videos = await teacherService.getStudentUploadedVideos(studentId);
    res.status(200).json({ success: true, data: videos });
  } catch (err) {
    console.error('getMyUploadedVideos error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch uploaded videos' });
  }
}

module.exports = { getMyCourses, getMyBootcamps, getMyUploadedVideos };
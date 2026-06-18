const publicBootcampService = require('../services/publicBootcampService');

async function createPublicBootcampController(req, res) {
  try {
    const profileUserId = req.user.id;
    const { title, description, videos, capacity } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!capacity || Number(capacity) <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive number' });
    }
    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: 'At least one video is required' });
    }

    const bootcamp = await publicBootcampService.createPublicBootcamp({
      profileUserId,
      title: title.trim(),
      description,
      videos,
      capacity: Number(capacity),
    });

    res.status(201).json({ bootcamp });
  } catch (err) {
    console.error('createPublicBootcamp error:', err);
    res.status(500).json({ error: err.message || 'Failed to create bootcamp' });
  }
}

async function listAvailablePublicBootcampsController(req, res) {
  try {
    const studentId = req.user.id;
    const bootcamps = await publicBootcampService.listAvailablePublicBootcamps(studentId);
    res.status(200).json({ bootcamps });
  } catch (err) {
    console.error('listAvailablePublicBootcamps error:', err);
    res.status(500).json({ error: 'Failed to fetch available bootcamps' });
  }
}

async function enrollPublicBootcampController(req, res) {
  try {
    const studentId = req.user.id;
    const { bootcampId } = req.params;
    const result = await publicBootcampService.enrollStudentInBootcamp({ studentId, bootcampId });

    if (!result?.success) {
      return res.status(409).json({ error: result?.message || 'Could not enroll' });
    }
    res.status(200).json({ message: result.message });
  } catch (err) {
    console.error('enrollPublicBootcamp error:', err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
}

module.exports = {
  createPublicBootcampController,
  listAvailablePublicBootcampsController,
  enrollPublicBootcampController,
};
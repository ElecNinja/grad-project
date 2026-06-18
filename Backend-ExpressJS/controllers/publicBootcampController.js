const {
  createPublicBootcamp,
  addSectionToBootcamp,
  addVideoToSection,
  makeBootcampPublic,
  listAvailablePublicBootcamps,
  enrollStudentInBootcamp,
} = require('../services/Publicbootcampservice');

// POST /api/teacher/public-bootcamps
// Teacher creates a bootcamp with its first section + that section's videos.
// Bootcamp starts private (single-student or empty); "Make Public" is separate.
async function createPublicBootcampController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { title, description, sectionTitle, videos, capacity } = req.body;

    if (!profileUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!sectionTitle || !sectionTitle.trim()) {
      return res.status(400).json({ error: 'Section title is required' });
    }
    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: 'At least one video is required' });
    }
    if (capacity !== undefined && capacity !== null && capacity !== '' && Number(capacity) <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive number' });
    }

    const bootcamp = await createPublicBootcamp({
      profileUserId,
      title,
      description,
      sectionTitle,
      videos,
      capacity: capacity ? Number(capacity) : null,
    });

    return res.status(201).json({ data: bootcamp });
  } catch (err) {
    console.error('createPublicBootcampController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create bootcamp' });
  }
}

// POST /api/teacher/public-bootcamps/:bootcampId/sections
// Teacher adds a new section (e.g. "CSS", "JavaScript") to an existing bootcamp.
async function addSectionController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { bootcampId } = req.params;
    const { sectionTitle } = req.body;

    if (!profileUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!sectionTitle || !sectionTitle.trim()) {
      return res.status(400).json({ error: 'Section title is required' });
    }

    const section = await addSectionToBootcamp({ profileUserId, bootcampId, sectionTitle });
    return res.status(201).json({ data: section });
  } catch (err) {
    console.error('addSectionController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add section' });
  }
}

// POST /api/teacher/public-bootcamps/:bootcampId/sections/:sectionId/videos
// Teacher adds a video under an existing section.
async function addVideoController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { bootcampId, sectionId } = req.params;
    const { title, url } = req.body;

    if (!profileUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!url) {
      return res.status(400).json({ error: 'Video url is required' });
    }

    const lesson = await addVideoToSection({ profileUserId, bootcampId, sectionId, title, url });
    return res.status(201).json({ data: lesson });
  } catch (err) {
    console.error('addVideoController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add video' });
  }
}

// POST /api/teacher/public-bootcamps/:bootcampId/make-public
// Teacher converts a private/single-student bootcamp into a public,
// capacity-limited, self-enroll bootcamp.
async function makeBootcampPublicController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { bootcampId } = req.params;
    const { capacity } = req.body;

    if (!profileUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!capacity || Number(capacity) <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive number' });
    }

    const result = await makeBootcampPublic({
      profileUserId,
      bootcampId,
      capacity: Number(capacity),
    });

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('makeBootcampPublicController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to make bootcamp public' });
  }
}

// GET /api/student/public-bootcamps
// Student browses bootcamps open for self-enrollment
async function listAvailablePublicBootcampsController(req, res) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const bootcamps = await listAvailablePublicBootcamps(studentId);
    return res.status(200).json({ data: bootcamps });
  } catch (err) {
    console.error('listAvailablePublicBootcampsController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to list bootcamps' });
  }
}

// POST /api/student/public-bootcamps/:bootcampId/enroll
// Student joins instantly if a spot is available
async function enrollPublicBootcampController(req, res) {
  try {
    const studentId = req.user?.id;
    const { bootcampId } = req.params;

    if (!studentId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!bootcampId) {
      return res.status(400).json({ error: 'bootcampId is required' });
    }

    const result = await enrollStudentInBootcamp({ studentId, bootcampId });

    if (result && result.success === false) {
      return res.status(409).json({ error: result.message || 'Could not enroll' });
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('enrollPublicBootcampController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to enroll in bootcamp' });
  }
}

module.exports = {
  createPublicBootcampController,
  addSectionController,
  addVideoController,
  makeBootcampPublicController,
  listAvailablePublicBootcampsController,
  enrollPublicBootcampController,
};
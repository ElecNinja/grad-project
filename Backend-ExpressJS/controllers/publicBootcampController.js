const {
  createPublicBootcamp,
  addSectionToBootcamp,
  addVideoToSection,
  makeBootcampPublic,
  listAvailablePublicBootcamps,
  enrollStudentInBootcamp,
} = require('../services/Publicbootcampservice');

const supabase = require('../config/supabase');

async function uploadBootcampImage(fileBuffer, mimeType, bootcampId) {
  const ext = mimeType?.split('/')[1] || 'jpg';
  const path = `bootcamp-covers/${bootcampId}.${ext}`;

  const { error } = await supabase.storage
    .from('bootcamp-images')
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('bootcamp-images').getPublicUrl(path);
  return data.publicUrl;
}

// POST /api/teacher/public-bootcamps
async function createPublicBootcampController(req, res) {
  try {
    const profileUserId = req.user?.id;

    const title        = req.body?.title;
    const description  = req.body?.description;
    const sectionTitle = req.body?.sectionTitle;
    const capacity     = req.body?.capacity;
    const price        = req.body?.price;
    const requirements = req.body?.requirements;
    const whatYouLearn = req.body?.whatYouLearn ?? null;   // ← الجديد

    let tags = req.body?.tags;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = []; }
    }
    if (!Array.isArray(tags)) tags = [];

    let videos = req.body?.videos;
    if (typeof videos === 'string') {
      try { videos = JSON.parse(videos); } catch { videos = []; }
    }

    if (!profileUserId) return res.status(401).json({ error: 'Not authenticated' });
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    if (!sectionTitle || !String(sectionTitle).trim()) return res.status(400).json({ error: 'Section title is required' });
    if (!Array.isArray(videos) || videos.length === 0)
      return res.status(400).json({ error: 'At least one video is required' });
    if (capacity !== undefined && capacity !== null && capacity !== '' && Number(capacity) <= 0)
      return res.status(400).json({ error: 'Capacity must be a positive number' });

    const bootcamp = await createPublicBootcamp({
      profileUserId,
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      sectionTitle: String(sectionTitle).trim(),
      videos,
      capacity: capacity ? Number(capacity) : null,
      price:    price    ? Number(price)    : 0,
      tags,
      requirements: requirements ? String(requirements).trim() : null,
      whatYouLearn: whatYouLearn ? String(whatYouLearn).trim() : null,   // ← الجديد
    });

    // Upload cover image if provided (non-fatal if it fails)
   console.log('req.file received?', !!req.file, req.file?.originalname, req.file?.mimetype);

if (req.file) {
  try {
    const imageUrl = await uploadBootcampImage(
      req.file.buffer,
      req.file.mimetype,
      bootcamp.id
    );
    console.log('✅ Image uploaded successfully, URL:', imageUrl);
        await supabase
          .from('bootcamps')
          .update({ thumbnail_url: imageUrl })
          .eq('id', bootcamp.id);
        bootcamp.thumbnail_url = imageUrl;
      } catch (imgErr) {
        console.warn('Bootcamp image upload failed (non-fatal):', imgErr.message);
      }
    }

    return res.status(201).json({ data: bootcamp });
  } catch (err) {
    console.error('createPublicBootcampController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create bootcamp' });
  }
}

// POST /api/teacher/public-bootcamps/:bootcampId/sections
async function addSectionController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { bootcampId } = req.params;
    const { title, videos } = req.body;

    if (!profileUserId) return res.status(401).json({ error: 'Not authenticated' });
    if (!title?.trim()) return res.status(400).json({ error: 'Section title is required' });
    if (!Array.isArray(videos) || videos.length === 0)
      return res.status(400).json({ error: 'At least one video is required' });

    const section = await addSectionToBootcamp({
      profileUserId,
      bootcampId,
      sectionTitle: title,
      videos,
    });
    return res.status(201).json({ data: section });
  } catch (err) {
    console.error('addSectionController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add section' });
  }
}

// POST /api/teacher/public-bootcamps/:bootcampId/sections/:sectionId/videos
async function addVideoController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { bootcampId, sectionId } = req.params;
    const { title, url } = req.body;

    if (!profileUserId) return res.status(401).json({ error: 'Not authenticated' });
    if (!url) return res.status(400).json({ error: 'Video url is required' });

    const lesson = await addVideoToSection({ profileUserId, bootcampId, sectionId, title, url });
    return res.status(201).json({ data: lesson });
  } catch (err) {
    console.error('addVideoController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add video' });
  }
}

// POST /api/teacher/public-bootcamps/:bootcampId/make-public
async function makeBootcampPublicController(req, res) {
  try {
    const profileUserId = req.user?.id;
    const { bootcampId } = req.params;
    const { capacity } = req.body;

    if (!profileUserId) return res.status(401).json({ error: 'Not authenticated' });
    if (!capacity || Number(capacity) <= 0)
      return res.status(400).json({ error: 'Capacity must be a positive number' });

    const result = await makeBootcampPublic({ profileUserId, bootcampId, capacity: Number(capacity) });
    return res.status(200).json({ data: result });
  } catch (err) {
    console.error('makeBootcampPublicController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to make bootcamp public' });
  }
}

// GET /api/student/public-bootcamps
async function listAvailablePublicBootcampsController(req, res) {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Not authenticated' });

    const bootcamps = await listAvailablePublicBootcamps(studentId);
    return res.status(200).json({ data: bootcamps });
  } catch (err) {
    console.error('listAvailablePublicBootcampsController error:', err);
    return res.status(500).json({ error: err.message || 'Failed to list bootcamps' });
  }
}

// POST /api/student/public-bootcamps/:bootcampId/enroll
async function enrollPublicBootcampController(req, res) {
  try {
    const studentId = req.user?.id;
    const { bootcampId } = req.params;

    if (!studentId)  return res.status(401).json({ error: 'Not authenticated' });
    if (!bootcampId) return res.status(400).json({ error: 'bootcampId is required' });

    const result = await enrollStudentInBootcamp({ studentId, bootcampId });
    if (result?.success === false)
      return res.status(409).json({ error: result.message || 'Could not enroll' });

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
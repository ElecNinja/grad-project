const teacherService = require("../services/teacherService");

// Upload material (students)
const uploadMaterial = async (req, res) => {
  try {
    const { studentId, description, materialType } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded." });
    const result = await teacherService.uploadMaterial(studentId, description, materialType, file);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOffers = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user?.id;
    const offers = await teacherService.getOffers(teacherId);
    res.status(200).json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const { offerId, price } = req.body;
    await teacherService.acceptOffer(offerId, price);
    res.status(200).json({ message: "Offer accepted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const summarizePdf = async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    const summary = await teacherService.summarizePdf(pdfUrl);
    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/teacher/list
 * Protected — any logged-in user can browse teacher profiles.
 */
const listTeachers = async (req, res) => {
  try {
    const teachers = await teacherService.listTeachers();
    res.status(200).json({ teachers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.params.id;
    if (!teacherId) return res.status(400).json({ error: "Teacher ID is required." });

    const teacher = await teacherService.getTeacherProfile(teacherId);
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });

    res.status(200).json({ teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return res.status(401).json({ error: "Unauthorized." });

    const updates = { ...req.body };
    if (req.file) {
      const fileName = `teacher_${teacherId}_${Date.now()}`;
      const { error: storageError } = await require("../config/supabase").storage
        .from("profile-photos")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = require("../config/supabase").storage
        .from("profile-photos")
        .getPublicUrl(fileName);
      updates.photo = urlData.publicUrl;
    }

    const teacher = await teacherService.updateTeacherProfile(teacherId, updates);
    res.status(200).json({ teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!studentId) return res.status(400).json({ error: "Student ID is required." });

    const student = await teacherService.getStudentProfile(studentId);
    if (!student) return res.status(404).json({ error: "Student not found." });

    res.status(200).json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: "Unauthorized." });

    const updates = { ...req.body };
    if (req.file) {
      const fileName = `student_${studentId}_${Date.now()}`;
      const { error: storageError } = await require("../config/supabase").storage
        .from("profile-photos")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = require("../config/supabase").storage
        .from("profile-photos")
        .getPublicUrl(fileName);
      updates.photo = urlData.publicUrl;
    }

    const student = await teacherService.updateStudentProfile(studentId, updates);
    res.status(200).json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  listTeachers,
  getTeacherProfile,
  updateTeacherProfile,
  getStudentProfile,
  updateStudentProfile,
};
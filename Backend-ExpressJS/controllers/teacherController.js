const teacherService = require("../services/teacherService");
const supabase = require("../config/supabase");
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

/**
 * GET /api/teacher/subjects
 * Protected — list subjects for specialties selection.
 */
const listSubjects = async (req, res) => {
  try {
    const subjects = await teacherService.listSubjects();
    res.status(200).json({ subjects });
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
    const photoFile = req.files?.photo?.[0] || null;
    const videoFile = req.files?.video?.[0] || null;

    if (photoFile) {
      const fileName = `teacher_${teacherId}_${Date.now()}`;
      const { error: storageError } = await require("../config/supabase").storage
        .from("profile-photos")
        .upload(fileName, photoFile.buffer, { contentType: photoFile.mimetype, upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = require("../config/supabase").storage
        .from("profile-photos")
        .getPublicUrl(fileName);
      updates.photo = urlData.publicUrl;
    }

    if (videoFile) {
      const fileExt = videoFile.originalname?.split(".").pop() || "mp4";
      const fileName = `teacher_intro_${teacherId}_${Date.now()}.${fileExt}`;
      const { error: storageError } = await require("../config/supabase").storage
        .from("teacher-videos")
        .upload(fileName, videoFile.buffer, { contentType: videoFile.mimetype, upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = require("../config/supabase").storage
        .from("teacher-videos")
        .getPublicUrl(fileName);
      updates.introduction_video = urlData.publicUrl;
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
// ===============================
// GET REQUESTS FOR TEACHER
// ===============================
const getRequestsController = async (req, res) => {
  try {
    console.log("Teacher ID:", req.user.id);
    const requests = await teacherService.getStudentRequests(req.user.id);
    console.log("Requests found:", requests?.length);
    return res.json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get requests" });
  }
};

// ===============================
// ACCEPT REQUEST (CREATE BID)
// ===============================
const acceptRequestController = async (req, res) => {
  try {
    const { requestId, price, sessionDuration, teachingMode, numSessions } = req.body;
    const teacherId = req.user.id;

    if (!requestId || !price) {
      return res.status(400).json({ error: "requestId and price are required." });
    }

    // Get teacher_profile id
    const { data: teacherProfile, error: tpError } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("profile_id", teacherId)
      .single();

    if (tpError || !teacherProfile) {
      return res.status(404).json({ error: "Teacher profile not found." });
    }

    // Insert into bids table
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert([{
        request_id: requestId,
        teacher_id: teacherProfile.id,
        price: parseFloat(price),
        currency: 'USD',
        session_duration_hr: sessionDuration || 1,
        teaching_mode: teachingMode || 'recorded',
        num_sessions: numSessions || 1,
        status: 'pending',
      }])
      .select()
      .single();

    if (bidError) {
      console.error("Bid error:", bidError);
      return res.status(500).json({ error: "Could not create bid." });
    }

    // Update request status to matched
    await supabase
      .from("student_requests")
      .update({ status: 'matched' })
      .eq("id", requestId);

    return res.status(201).json({ message: "Bid created successfully", bid });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

// ===============================
// GET ACCEPTED OFFERS FOR TEACHER
// ===============================
const getAcceptedOffersTeacher = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const offers = await teacherService.getAcceptedOffersTeacher(teacherId);
    res.status(200).json({ offers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error." });
  }
};

// ===============================
// UPLOAD COURSE CONTENT (TEACHER)
// ===============================
const uploadCourseContent = async (req, res) => {
  try {
    const { bidId, title, description, contentType } = req.body;
    const file = req.file;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!bidId || !title || !contentType) {
      return res.status(400).json({ error: "bidId, title, and contentType are required." });
    }

    // Verify the bid belongs to this teacher
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("*")
      .eq("id", bidId)
      .single();

    if (bidError || !bid) {
      return res.status(404).json({ error: "Bid not found." });
    }

    // Verify teacher owns this bid
    const { data: teacherProfile, error: tpError } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("profile_id", teacherId)
      .single();

    if (bid.teacher_id !== teacherProfile.id) {
      return res.status(403).json({ error: "Unauthorized to upload for this course." });
    }

    // Upload file to storage if provided
    let fileUrl = null;
    if (file) {
      const fileName = `course_${bidId}_${Date.now()}_${file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("course-materials")
        .getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
    }

    // Insert course content
    const { data: content, error: contentError } = await supabase
      .from("course_content")
      .insert([{
        bid_id: bidId,
        title,
        description: description || '',
        content_type: contentType,
        file_url: fileUrl,
        created_at: new Date(),
      }])
      .select()
      .single();

    if (contentError) {
      console.error("Content error:", contentError);
      return res.status(500).json({ error: "Could not save course content." });
    }

    return res.status(201).json({ message: "Course content uploaded successfully", content });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error." });
  }
};

// ===============================
// GET COURSE CONTENT FOR STUDENT
// ===============================
const getCourseContent = async (req, res) => {
  try {
    const { bidId } = req.params;
    const studentId = req.user?.id;

    if (!studentId || !bidId) {
      return res.status(400).json({ error: "Missing bidId." });
    }

    // Get course content
    const { data: content, error: contentError } = await supabase
      .from("course_content")
      .select("*")
      .eq("bid_id", bidId)
      .order("created_at", { ascending: false });

    if (contentError) {
      console.error("Content error:", contentError);
      return res.status(500).json({ error: "Could not fetch course content." });
    }

    return res.status(200).json({ content });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error." });
  }
};

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  listTeachers,
  listSubjects,
  getTeacherProfile,
  updateTeacherProfile,
  getStudentProfile,
  updateStudentProfile,
  getRequestsController,   
  acceptRequestController,
  getAcceptedOffersTeacher,
  uploadCourseContent,
  getCourseContent,
};
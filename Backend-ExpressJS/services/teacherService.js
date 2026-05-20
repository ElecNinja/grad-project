const supabase = require("../config/supabase");
const axios = require("axios");

const baseProfileSelect = "id, full_name, email, role, bio, avatar_url";

const mapProfile = (profile, extras = {}) => ({
  id: profile.id,
  name: profile.full_name || profile.name || "",
  email: profile.email || "",
  role: profile.role || "",
  bio: profile.bio || extras.headline || "",
  photo: profile.avatar_url || profile.photo || "",
  subject: extras.headline || profile.subject || "",
  price_per_hour: profile.price_per_hour ?? null,
  rating: profile.rating ?? null,
  years_experience: extras.years_experience ?? null,
  teaching_languages: extras.teaching_languages ?? [],
});

const loadTeacherExtras = async (profileIds) => {
  if (!profileIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("teacher_profiles")
    .select("profile_id, headline, years_experience, teaching_languages")
    .in("profile_id", profileIds);

  if (error || !data) {
    return new Map();
  }

  return new Map(data.map((row) => [row.profile_id, row]));
};

// ===============================
// Upload material to storage + DB
// ===============================
const uploadMaterial = async (studentId, description, materialType, file) => {
  const fileName = `${studentId}_${Date.now()}.pdf`;
  const { error: storageError } = await supabase.storage
    .from("teacher-materials")
    .upload(fileName, file.buffer, { contentType: "application/pdf" });
  if (storageError) throw storageError;

  // Get public URL of uploaded file
  const { data: publicUrlData } = supabase.storage
    .from("teacher-materials")
    .getPublicUrl(fileName);
  const pdfUrl = publicUrlData.publicUrl;

  const idPdf = Date.now();
  const { error: uploadError } = await supabase
    .from("upload-pdf")
    .insert([{
      uploader_id: studentId,
      title: file.originalname || 'Uploaded Material',
      description: description || null,
      resource_type: resourceTypeMap[materialType] || 'other',
      file_url: pdfUrl,
      file_size_bytes: file.size || null,
      is_public: true,
    }]);
  if (uploadError) throw uploadError;
  return { pdfUrl };
};

// ===============================
// Get all offers from DB + student info
// ===============================
const getOffers = async (teacherId) => {
  const { data: pdfs, error } = await supabase
    .from("upload-pdf")
    .select("*");
  if (error) throw error;

  const offersWithStudentInfo = await Promise.all(
    pdfs.map(async (pdf) => {
      const { data: student } = await supabase
        .from("signup-students")
        .select("name, photo")
        .eq("id", pdf["id-student"])
        .single();
      return {
        ...pdf,
        studentName: student?.name || "Student",
        studentPhoto: student?.photo || null,
      };
    })
  );
  return offersWithStudentInfo;
};

// ===============================
// Accept an offer in DB
// ===============================
const acceptOffer = async (offerId, price) => {
  const { error } = await supabase
    .from("offer-teacher")
    .update({ "accept or not": "accepted" })
    .eq("id-pdf", offerId);
  if (error) throw error;
};

// ===============================
// Call AI service to summarize PDF
// ===============================
const summarizePdf = async (pdfUrl) => {
  const response = await axios.post(
    "http://127.0.0.1:8000/summarize-from-url",
    { pdfUrl }
  );
  return response.data;
};

// ===============================
// Get teacher profile by ID
// ===============================
const getTeacherProfile = async (teacherId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(baseProfileSelect)
    .eq("id", teacherId)
    .eq("role", "teacher")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  const extras = await loadTeacherExtras([data.id]);
  return mapProfile(data, extras.get(data.id));
};

// ===============================
// List all teachers
// ===============================
const listTeachers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select(baseProfileSelect)
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  if (error) throw error;

  const extras = await loadTeacherExtras((data || []).map((teacher) => teacher.id));

  return (data || []).map((teacher) => mapProfile(teacher, extras.get(teacher.id)));
};

// ===============================
// Update teacher profile (own profile)
// ===============================
const updateTeacherProfile = async (teacherId, updates) => {
  // Only allow these fields to be updated — no id/email tampering
  const allowed = ["name", "bio", "subject", "photo"];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(safeUpdates.name !== undefined ? { full_name: safeUpdates.name } : {}),
      ...(safeUpdates.bio !== undefined ? { bio: safeUpdates.bio } : {}),
      ...(safeUpdates.photo !== undefined ? { avatar_url: safeUpdates.photo } : {}),
    })
    .eq("id", teacherId)
    .select(baseProfileSelect)
    .single();
  if (error) throw error;

  if (safeUpdates.subject) {
    await supabase
      .from("teacher_profiles")
      .upsert({
        profile_id: teacherId,
        headline: safeUpdates.subject,
      }, { onConflict: "profile_id" });
  }

  const extras = await loadTeacherExtras([data.id]);
  return mapProfile(data, extras.get(data.id));
};

// ===============================
// Get student profile by ID
// ===============================
const getStudentProfile = async (studentId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(baseProfileSelect)
    .eq("id", studentId)
    .eq("role", "student")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return mapProfile(data);
};

// ===============================
// Update student profile (own profile)
// ===============================
const updateStudentProfile = async (studentId, updates) => {
  const allowed = ["name", "bio", "photo"];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(safeUpdates.name !== undefined ? { full_name: safeUpdates.name } : {}),
      ...(safeUpdates.bio !== undefined ? { bio: safeUpdates.bio } : {}),
      ...(safeUpdates.photo !== undefined ? { avatar_url: safeUpdates.photo } : {}),
    })
    .eq("id", studentId)
    .select(baseProfileSelect)
    .single();
  if (error) throw error;
  return mapProfile(data);
};

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  getTeacherProfile,
  listTeachers,
  updateTeacherProfile,
  getStudentProfile,
  updateStudentProfile,
};
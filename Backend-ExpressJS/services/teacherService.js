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
  if (!profileIds || profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("teacher_profiles")
    .select("profile_id, headline, years_experience, teaching_languages")
    .in("profile_id", profileIds);

  if (error || !data) return new Map();

  return new Map(data.map((row) => [row.profile_id, row]));
};

// ===============================
// Upload material to storage + DB
// ===============================
const uploadMaterial = async (studentId, description, materialType, file) => {
  // Generate unique file name
  const fileExt = file.originalname?.split('.').pop() || 'pdf';
  const fileName = `${studentId}_${Date.now()}.${fileExt}`;

  // Upload file to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("teacher-materials")
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (storageError) {
    console.error("Storage error:", storageError);
    throw storageError;
  }

  // Get public URL of uploaded file
  const { data: publicUrlData } = supabase.storage
    .from("teacher-materials")
    .getPublicUrl(fileName);

  const pdfUrl = publicUrlData.publicUrl;

  // Map materialType to resource_type allowed values
  const resourceTypeMap = {
    bootCamp: 'bootCamp',
    recordVideo: 'recordVideo',
    meeting: 'meeting',
    pdf: 'pdf',
    note: 'note',
  };

  // Save to community_resources table
  const { error: dbError } = await supabase
    .from("community_resources")
    .insert([{
      uploader_id: studentId,
      title: file.originalname || 'Uploaded Material',
      description: description || null,
      resource_type: resourceTypeMap[materialType] || 'other',
      file_url: pdfUrl,
      file_size_bytes: file.size || null,
      is_public: true,
    }]);

  if (dbError) {
    console.error("DB error:", dbError);
    throw dbError;
  }

  return { pdfUrl };
};

// ===============================
// Get all offers from DB + student info
// ===============================
const getOffers = async (teacherId) => {
  // Use explicit foreign key to avoid ambiguous relationship error
  const { data: resources, error } = await supabase
    .from("community_resources")
    .select(`
      *,
      profiles!community_resources_uploader_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq("is_public", true);

  if (error) throw error;

  return resources.map((r) => ({
    ...r,
    studentName: r.profiles?.full_name || "Student",
    studentPhoto: r.profiles?.avatar_url || null,
  }));
};

// ===============================
// Accept an offer in DB
// ===============================
const acceptOffer = async (offerId, price) => {
  const { error } = await supabase
    .from("community_resources")
    .update({ is_public: true })
    .eq("id", offerId);

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
// Get student requests for teacher
// ===============================
const getStudentRequests = async (teacherSubject) => {

  let query = supabase                        
    .from("student_requests")
    .select(`
      *,
      profiles!student_requests_student_id_fkey (
        full_name,
        avatar_url
      ),
      request_files (
        file_name,
        file_url,
        mime_type
      )
    `)
    .is("deleted_at", null)
    .eq("status", "pending_analysis")
    .order("created_at", { ascending: false });

 
  if (teacherSubject) {
    query = query.eq("preferred_language", teacherSubject);
  }

  const { data: requests, error } = await query; // ✅ await query مش supabase

  if (error) throw error;

  return requests.map((r) => ({
    ...r,
    studentName: r.profiles?.full_name || "Student",
    studentPhoto: r.profiles?.avatar_url || null,
    fileUrl: r.request_files?.[0]?.file_url || null,
    fileName: r.request_files?.[0]?.file_name || null,
    subject: r.preferred_language || "Not specified",
  }));
};

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  getStudentRequests,
  getTeacherProfile,
  listTeachers,
  updateTeacherProfile,
  getStudentProfile,
  updateStudentProfile,
};

// ===============================
// Get teacher profile by ID
// ===============================
async function getTeacherProfile(teacherId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(baseProfileSelect)
    .eq("id", teacherId)
    .eq("role", "teacher")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const extras = await loadTeacherExtras([data.id]);
  return mapProfile(data, extras.get(data.id));
}

// ===============================
// List all teachers
// ===============================
async function listTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(baseProfileSelect)
    .eq("role", "teacher")
    .order("full_name", { ascending: true });

  if (error) throw error;

  const extras = await loadTeacherExtras((data || []).map((t) => t.id));
  return (data || []).map((t) => mapProfile(t, extras.get(t.id)));
}

// ===============================
// Update teacher profile
// ===============================
async function updateTeacherProfile(teacherId, updates) {
  const allowed = ["name", "bio", "subject", "photo"];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  if (Object.keys(safeUpdates).length === 0) throw new Error("No valid fields to update.");

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
      .upsert({ profile_id: teacherId, headline: safeUpdates.subject }, { onConflict: "profile_id" });
  }

  const extras = await loadTeacherExtras([data.id]);
  return mapProfile(data, extras.get(data.id));
}

// ===============================
// Get student profile by ID
// ===============================
async function getStudentProfile(studentId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(baseProfileSelect)
    .eq("id", studentId)
    .eq("role", "student")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapProfile(data);
}

// ===============================
// Update student profile
// ===============================
async function updateStudentProfile(studentId, updates) {
  const allowed = ["name", "bio", "photo"];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );

  if (Object.keys(safeUpdates).length === 0) throw new Error("No valid fields to update.");

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
}
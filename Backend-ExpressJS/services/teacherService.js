const supabase = require("../config/supabase");
const axios = require("axios");

const baseProfileSelect =
  "id, full_name, email, role, bio, avatar_url";

const mapProfile = (profile, extras = {}) => ({
  id: profile.id,
  name: profile.full_name || profile.name || "",
  email: profile.email || "",
  role: profile.role || "",
  bio: profile.bio || "",
  photo: profile.avatar_url || profile.photo || "",
  headline: extras.headline ?? null,
  // Backwards-compatible fields used by older frontend pages
  subject: extras.headline ?? "",
  introduction_video: extras.introduction_video ?? null,
  hourly_rate_min: extras.hourly_rate_min ?? null,
  hourly_rate_max: extras.hourly_rate_max ?? null,
  price_per_hour: extras.hourly_rate_min ?? null,
  years_experience: extras.years_experience ?? null,
  teaching_languages: extras.teaching_languages ?? [],
  avg_rating: extras.avg_rating ?? null,
  rating: extras.avg_rating ?? null,
  rating_count: extras.rating_count ?? null,
  is_accepting: extras.is_accepting ?? null,
  specialties: extras.specialties ?? [],
});

const loadTeacherExtras = async (profileIds) => {
  if (!profileIds || profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("teacher_profiles")
    .select(
      "id, profile_id, headline, introduction_video, hourly_rate_min, hourly_rate_max, years_experience, teaching_languages, avg_rating, rating_count, is_accepting"
    )
    .in("profile_id", profileIds);

  if (error || !data) return new Map();

  return new Map(data.map((row) => [row.profile_id, row]));
};

const loadTeacherSpecialties = async (teacherProfileId) => {
  if (!teacherProfileId) return [];

  const { data, error } = await supabase
    .from("teacher_subjects")
    .select(
      `
      proficiency,
      subjects!teacher_subjects_subject_id_fkey (
        id,
        name,
        slug
      )
    `
    )
    .eq("teacher_id", teacherProfileId);

  if (error || !data) return [];

  return data
    .map((row) => ({
      id: row.subjects?.id,
      name: row.subjects?.name,
      slug: row.subjects?.slug,
      proficiency: row.proficiency || "intermediate",
    }))
    .filter((s) => s.id && s.name);
};

async function listSubjects() {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// ===============================
// Upload material to storage + DB
// ===============================
const uploadMaterial = async (
  studentId,
  description,
  materialType,
  file
) => {
  const fileExt = file.originalname?.split(".").pop() || "pdf";
  const fileName = `${studentId}_${Date.now()}.${fileExt}`;

  const { error: storageError } = await supabase.storage
    .from("teacher-materials")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (storageError) {
    console.error("Storage error:", storageError);
    throw storageError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("teacher-materials")
    .getPublicUrl(fileName);

  const pdfUrl = publicUrlData.publicUrl;

  const resourceTypeMap = {
    bootCamp: "bootCamp",
    recordVideo: "recordVideo",
    meeting: "meeting",
    pdf: "pdf",
    note: "note",
  };

  const { error: dbError } = await supabase
    .from("community_resources")
    .insert([
      {
        uploader_id: studentId,
        title: file.originalname || "Uploaded Material",
        description: description || null,
        resource_type: resourceTypeMap[materialType] || "other",
        file_url: pdfUrl,
        file_size_bytes: file.size || null,
        is_public: true,
      },
    ]);

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
// GET STUDENT REQUESTS MATCHED
// ===============================
const getStudentRequests = async (profileId) => {
  try {
    console.log("Logged profile ID:", profileId);

    // Get teacher_profiles.id from profile_id
    const { data: teacherProfile, error: profileError } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("profile_id", profileId)
      .single();

    if (profileError || !teacherProfile) {
      console.log("Teacher profile not found:", profileError);
      return [];
    }

    console.log("Teacher Profile Found:", teacherProfile);

    // Get matched requests
    const { data: matches, error } = await supabase
      .from("request_matches")
      .select(`
        match_score, rank,
        student_requests!request_matches_request_id_fkey (
          id, student_id, description, preferred_mode, status,
          request_files ( file_name, file_url, mime_type )
        )
      `)
      .eq("teacher_id", teacherProfile.id)
      .order("rank", { ascending: true });

    if (error || !matches) {
      console.log("Matches error:", error);
      return [];
    }

    // Get student IDs
    const studentIds = matches
      .map(m => m.student_requests?.student_id)
      .filter(Boolean);

    console.log("Student IDs:", studentIds);

    // Fetch profiles separately
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", studentIds);

    console.log("Profiles fetched:", profiles);

    // Build a map for quick lookup
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    return matches.map((m) => {
      const r = m.student_requests;
      const profile = profileMap[r?.student_id] || {};

      return {
        id: r?.id,
        studentName: profile.full_name || "Student",
        studentPhoto: profile.avatar_url || null,
        description: r?.description || "",
        preferred_mode: r?.preferred_mode || "",
        status: r?.status || "",
        fileUrl: r?.request_files?.[0]?.file_url || null,
        fileName: r?.request_files?.[0]?.file_name || null,
      };
    });

  } catch (err) {
    console.log("getStudentRequests error:", err);
    return [];
  }
};
module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  getStudentRequests,
  getTeacherProfile,
  listTeachers,
  listSubjects,
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
  const extraRow = extras.get(data.id) || {};
  const specialties = await loadTeacherSpecialties(extraRow.id);

  return mapProfile(data, { ...extraRow, specialties });
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

  const extras = await loadTeacherExtras(
    (data || []).map((t) => t.id)
  );

  return (data || []).map((t) =>
    mapProfile(t, extras.get(t.id))
  );
}

// ===============================
// Update teacher profile
// ===============================
async function updateTeacherProfile(teacherId, updates) {
  const allowed = [
    "name",
    "bio",
    "photo",
    "headline",
    "introduction_video",
    "hourly_rate_min",
    "hourly_rate_max",
    "years_experience",
    "teaching_languages",
    "specialty_subject_ids",
    "specialties",
  ];

  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowed.includes(key)
    )
  );

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  // Parse JSON fields if they come as strings (multipart/form-data)
  const parseJsonMaybe = (val) => {
    if (val === undefined || val === null) return val;
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (!trimmed) return val;
    if (!(trimmed.startsWith("[") || trimmed.startsWith("{"))) return val;
    try {
      return JSON.parse(trimmed);
    } catch {
      return val;
    }
  };

  safeUpdates.teaching_languages = parseJsonMaybe(safeUpdates.teaching_languages);
  safeUpdates.specialty_subject_ids = parseJsonMaybe(safeUpdates.specialty_subject_ids);
  safeUpdates.specialties = parseJsonMaybe(safeUpdates.specialties);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(safeUpdates.name !== undefined
        ? { full_name: safeUpdates.name }
        : {}),

      ...(safeUpdates.bio !== undefined
        ? { bio: safeUpdates.bio }
        : {}),

      ...(safeUpdates.photo !== undefined
        ? { avatar_url: safeUpdates.photo }
        : {}),
    })
    .eq("id", teacherId)
    .select(baseProfileSelect)
    .single();

  if (error) throw error;

  // Upsert teacher_profiles details
  const tpPayload = {
    profile_id: teacherId,
    ...(safeUpdates.headline !== undefined ? { headline: safeUpdates.headline } : {}),
    ...(safeUpdates.introduction_video !== undefined
      ? { introduction_video: safeUpdates.introduction_video }
      : {}),
    ...(safeUpdates.hourly_rate_min !== undefined
      ? { hourly_rate_min: safeUpdates.hourly_rate_min }
      : {}),
    ...(safeUpdates.hourly_rate_max !== undefined
      ? { hourly_rate_max: safeUpdates.hourly_rate_max }
      : {}),
    ...(safeUpdates.years_experience !== undefined
      ? { years_experience: safeUpdates.years_experience }
      : {}),
    ...(safeUpdates.teaching_languages !== undefined && Array.isArray(safeUpdates.teaching_languages)
      ? { teaching_languages: safeUpdates.teaching_languages }
      : {}),
  };

  // Only upsert if any teacher_profiles fields were provided
  const tpHasExtras = Object.keys(tpPayload).length > 1;
  if (tpHasExtras) {
    await supabase.from("teacher_profiles").upsert(tpPayload, { onConflict: "profile_id" });
  }

  // Resolve teacher_profiles.id for specialties update and final response
  const { data: tpRow, error: tpError } = await supabase
    .from("teacher_profiles")
    .select("id")
    .eq("profile_id", teacherId)
    .single();
  if (tpError) throw tpError;

  // Specialties update: accept either specialty_subject_ids: uuid[] or specialties: [{subject_id, proficiency}]
  const subjectIds = Array.isArray(safeUpdates.specialty_subject_ids)
    ? safeUpdates.specialty_subject_ids
    : null;
  const specialties = Array.isArray(safeUpdates.specialties) ? safeUpdates.specialties : null;

  if (subjectIds || specialties) {
    // Clear existing then insert new
    await supabase.from("teacher_subjects").delete().eq("teacher_id", tpRow.id);

    let insertRows = [];
    if (specialties) {
      insertRows = specialties
        .map((s) => ({
          teacher_id: tpRow.id,
          subject_id: s.subject_id || s.id,
          proficiency: s.proficiency || "intermediate",
        }))
        .filter((r) => r.subject_id);
    } else if (subjectIds) {
      insertRows = subjectIds
        .filter(Boolean)
        .map((subject_id) => ({
          teacher_id: tpRow.id,
          subject_id,
          proficiency: "intermediate",
        }));
    }

    if (insertRows.length > 0) {
      const { error: insErr } = await supabase.from("teacher_subjects").insert(insertRows);
      if (insErr) throw insErr;
    }
  }

  const extras = await loadTeacherExtras([data.id]);
  const extraRow = extras.get(data.id) || {};
  const updatedSpecialties = await loadTeacherSpecialties(extraRow.id);

  return mapProfile(data, { ...extraRow, specialties: updatedSpecialties });
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
    Object.entries(updates).filter(([key]) =>
      allowed.includes(key)
    )
  );

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(safeUpdates.name !== undefined
        ? { full_name: safeUpdates.name }
        : {}),

      ...(safeUpdates.bio !== undefined
        ? { bio: safeUpdates.bio }
        : {}),

      ...(safeUpdates.photo !== undefined
        ? { avatar_url: safeUpdates.photo }
        : {}),
    })
    .eq("id", studentId)
    .select(baseProfileSelect)
    .single();

  if (error) throw error;

  return mapProfile(data);
}
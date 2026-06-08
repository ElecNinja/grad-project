const supabase = require("../config/supabase");
const axios = require("axios");

const baseProfileSelect =
  "id, full_name, email, role, bio, avatar_url";

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

// ===============================
// GET ACCEPTED OFFERS FOR TEACHER
// ===============================
const getAcceptedOffersTeacher = async (profileId) => {
  try {
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

    // Get all bids for this teacher (their accepted offers)
    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select(`
        id,
        price,
        currency,
        teaching_mode,
        num_sessions,
        status,
        student_requests!bids_request_id_fkey (
          id,
          student_id,
          title,
          description,
          preferred_mode,
          status,
          created_at
        ),
        student_profiles:student_requests!bids_request_id_fkey(student_id) (
          student_id
        )
      `)
      .eq("teacher_id", teacherProfile.id)
      .neq("status", "rejected");

    if (bidsError) {
      console.log("Bids error:", bidsError);
      return [];
    }

    // Get student IDs
    const studentIds = bids
      .map(b => b.student_requests?.student_id)
      .filter(Boolean);

    // Fetch student profiles
    const { data: studentProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", studentIds);

    // Build a map for quick lookup
    const studentProfileMap = {};
    (studentProfiles || []).forEach(p => { studentProfileMap[p.id] = p; });

    return bids.map((bid) => {
      const req = bid.student_requests;
      const studentProfile = studentProfileMap[req?.student_id] || {};

      return {
        id: bid.id,
        requestId: req?.id,
        type: req?.preferred_mode || bid.teaching_mode || "recorded",
        title: req?.title || "Untitled",
        description: req?.description || "",
        studentName: studentProfile.full_name || "Student",
        studentPhoto: studentProfile.avatar_url || null,
        pricePerHour: bid.price || 0,
        currency: bid.currency || "USD",
        numSessions: bid.num_sessions || 1,
        bidStatus: bid.status || "pending",
        createdAt: req?.created_at || null,
      };
    });

  } catch (err) {
    console.log("getAcceptedOffersTeacher error:", err);
    return [];
  }
};

module.exports = {
  uploadMaterial,
  getOffers,
  acceptOffer,
  summarizePdf,
  getStudentRequests,
  getAcceptedOffersTeacher,
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
  const allowed = ["name", "bio", "subject", "photo"];

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
    .eq("id", teacherId)
    .select(baseProfileSelect)
    .single();

  if (error) throw error;

  if (safeUpdates.subject) {
    await supabase.from("teacher_profiles").upsert(
      {
        profile_id: teacherId,
        headline: safeUpdates.subject,
      },
      { onConflict: "profile_id" }
    );
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
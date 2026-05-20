// services/authService.js

const supabase = require("../config/supabase");

const mapProfileToUser = (profile) => {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.full_name || profile.name || "",
    full_name: profile.full_name || profile.name || "",
    email: profile.email || "",
    role: profile.role || "",
    photo: profile.avatar_url || profile.photo || "",
    avatar_url: profile.avatar_url || profile.photo || "",
    bio: profile.bio || null,
    is_verified: profile.is_verified ?? null,
  };
};

// ===============================
// Check if email already exists
// ===============================
const checkExistingEmail = async (email) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};

// ===============================
// Update profile created by trigger
// ===============================
const updateProfile = async (userId, fields) => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: fields.email,
      full_name: fields.full_name,
      role: fields.role,
      bio: fields.bio,
      avatar_url: fields.avatar_url,
    })
    .select()
    .single();

  return { data, error };
};

// ===============================
// Get profile by profile id
// ===============================
const getProfileById = async (profileId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, bio, avatar_url, is_verified")
    .eq("id", profileId)
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: mapProfileToUser(data), error: null };
};

// ===============================
// Create teacher profile
// ===============================
const createTeacherProfile = async (profileId, fields) => {
  const { data, error } = await supabase
    .from("teacher_profiles")
    .insert([
      {
        profile_id: profileId,
        ...fields,
      },
    ])
    .select()
    .single();

  return { data, error };
};

module.exports = {
  checkExistingEmail,
  updateProfile,
  createTeacherProfile,
  getProfileById,
  mapProfileToUser,
};
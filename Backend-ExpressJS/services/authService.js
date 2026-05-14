// services/authService.js

const supabase = require("../config/supabase");

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
};
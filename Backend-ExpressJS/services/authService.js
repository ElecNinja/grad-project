// ===============================
// authService.js
// Uses Supabase Auth — no custom
// login-users table needed anymore
// ===============================
const supabase = require("../config/supabase");

// ===============================
// Check if email already exists
// Supabase Auth handles this but
// we keep it for a clean error msg
// ===============================
const checkExistingEmail = async (email) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (error) return [];
  return data;
};

// ===============================
// Create auth account via
// Supabase Auth (handles password
// hashing internally — no bcrypt)
// ===============================
const createLoginAccount = async (email, password, name, role) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,       // skip email confirmation for now
    user_metadata: {
      full_name: name,
      role,
    },
  });

  return { data, error };
};

// ===============================
// Update the profile row that the
// DB trigger already created.
// We never INSERT here — the trigger
// trg_on_auth_user_created handles
// that automatically on auth signup.
// ===============================
const updateProfile = async (userId, fields) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select("id, full_name, email, role, avatar_url")
    .single();

  return { data, error };
};

// ===============================
// Create teacher_profiles row
// Only called when role = teacher
// ===============================
const createTeacherProfile = async (profileId, fields) => {
  const { data, error } = await supabase
    .from("teacher_profiles")
    .insert([{ profile_id: profileId, ...fields }])
    .select("id")
    .single();

  return { data, error };
};

module.exports = {
  checkExistingEmail,
  createLoginAccount,
  updateProfile,
  createTeacherProfile,
};
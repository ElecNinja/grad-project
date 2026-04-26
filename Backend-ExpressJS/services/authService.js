// ===============================
// Import required packages
// ===============================
const bcrypt = require("bcrypt");
const supabase = require("../config/supabase");

// ===============================
// Check if email already exists
// ===============================
const checkExistingEmail = async (email) => {
  const { data } = await supabase
    .from("login-users")
    .select("id")
    .eq("email", email)
    .limit(1);

  return data;
};

// ===============================
// Create login account
// ===============================
const createLoginAccount = async (email, password, role) => {
  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("login-users")
    .insert([
      {
        email,
        password: hashedPassword,
        role
      }
    ])
    .select("id")
    .single();

  return { data, error };
};

// ===============================
// Create student/teacher profile
// ===============================
const createProfile = async (
  loginUserId,
  name,
  email,
  phone,
  about,
  photo,
  role,
  education,
  experience
) => {
  const table =
    role === "teacher"
      ? "signup-teachers"
      : "signup-students";

  const record =
    role === "teacher"
      ? {
          id: loginUserId,
          name,
          email,
          phone: phone || null,
          education: education || null,
          experience: experience || null,
          photo: photo || null,
          role: "teacher"
        }
      : {
          id: loginUserId,
          name,
          email,
          phone: phone || null,
          about: about || null,
          photo: photo || null,
          role: "student"
        };

  const { data, error } = await supabase
    .from(table)
    .insert([record])
    .select("id, name, email, role")
    .single();

  return { data, error };
};

// ===============================
// Export services
// ===============================
module.exports = {
  checkExistingEmail,
  createLoginAccount,
  createProfile
};
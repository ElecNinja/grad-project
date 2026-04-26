const { INPUT_LENGTH } = require("./constants");

// ======================================
// Validate email format and length
// ======================================
const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: "Email is required." };
  }
  if (email.length < INPUT_LENGTH.email.minValue ||
      email.length > INPUT_LENGTH.email.maxValue) {
    return { valid: false, error: "Email must be between 3 and 320 characters." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format." };
  }
  return { valid: true };
};

// ======================================
// Validate password length
// ======================================
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < INPUT_LENGTH.password.minValue) {
    return { valid: false, error: "Password must be at least 8 characters." };
  }
  if (password.length > INPUT_LENGTH.password.maxValue) {
    return { valid: false, error: "Password must be less than 60 characters." };
  }
  return { valid: true };
};

// ======================================
// Validate name length
// ======================================
const validateName = (name) => {
  if (!name) {
    return { valid: false, error: "Name is required." };
  }
  if (name.length < INPUT_LENGTH.name.minValue ||
      name.length > INPUT_LENGTH.name.maxValue) {
    return { valid: false, error: "Name must be between 1 and 200 characters." };
  }
  return { valid: true };
};

// ======================================
// Validate full signup input
// ======================================
const validateSignup = (name, email, password, role) => {
  const nameCheck = validateName(name);
  if (!nameCheck.valid) return nameCheck;

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return emailCheck;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) return passwordCheck;

  if (!role || !["student", "teacher"].includes(role)) {
    return { valid: false, error: "Role must be student or teacher." };
  }

  return { valid: true };
};

// ======================================
// Validate login input
// ======================================
const validateLogin = (email, password) => {
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return emailCheck;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) return passwordCheck;

  return { valid: true };
};

// ======================================
// Export validators
// ======================================
module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateSignup,
  validateLogin
};
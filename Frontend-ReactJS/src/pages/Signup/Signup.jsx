import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import "./Signup.css";
import { signupUser } from '../../apis/handlers/signupUser';
import { useDispatch } from 'react-redux';
import { setLoader } from '../../redux/loaderSlice.js';
import { supabase } from '../../config/supabaseClient';

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    photo: null,
    photoPreview: null,
    name: '',
    phone: '',
    about: '',
    education: '',
    experience: '',
  });
  const [cardData, setCardData] = useState({
    paymentMethod: 'card',
    cardNumber: '',
    nameOnCard: '',
    bankName: '',
    saveCard: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  const uploadPhotoToSupabase = async (file, userId) => {
    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const filePath = `profiles/${userId}.${fileExt}`;
      const { error: uploadError } = await supabase
        .storage
        .from('avatar')
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        console.warn('Photo upload failed:', uploadError.message);
        return null;
      }
      const { data } = supabase.storage.from('avatar').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.warn('Photo upload error:', err);
      return null;
    }
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    return true;
  };

  const validateTeacherStep2 = () => {
    if (!formData.name || !formData.phone || !formData.about ||
        !formData.education || !formData.experience) {
      setError('Please fill in all fields.');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleTeacherStep2Submit = (e) => {
    e.preventDefault();
    if (!validateTeacherStep2()) return;
    setStep(3); // ✅ goes to VISA step (step 3 now)
  };

  const handleFinalSubmit = async (e, submitRole) => {
    e.preventDefault();
    dispatch(setLoader(true));
    setError('');

    try {
      // 1. Create Supabase auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        dispatch(setLoader(false));
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        setError('Could not create account.');
        dispatch(setLoader(false));
        return;
      }

      // 2. Sign in immediately
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      // 3. Upload photo — optional
      let photoUrl = null;
      if (formData.photo) {
        photoUrl = await uploadPhotoToSupabase(formData.photo, userId);
      }

      // 4. Save profile via backend
      const result = await signupUser({
        userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        about: formData.about,
        photo: photoUrl,
        role: submitRole,
        education: formData.education || null,
        experience: formData.experience || null,
      });

      dispatch(setLoader(false));

      if (result.response) {
        navigate('/login');
      } else {
        setError(result.message);
      }

    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
      dispatch(setLoader(false));
    }
  };

  // ==============================
  // STEP 1 — Email & Password
  // ==============================
  if (step === 1) {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
              onClick={() => setRole('teacher')}
            >
              Teacher
            </button>
          </div>

          <h1 className="signup-title">Create an account</h1>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleStep1Submit} className="signup-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="create-account-btn">
              Create account
            </button>

            <button type="button" className="google-btn">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="login-text">
            Already have an account? <Link to="/login" className="login-link">Log In</Link>
          </p>
        </div>
      </div>
    );
  }

  // ==============================
  // STEP 2 — Student Details
  // ==============================
  if (step === 2 && role === 'student') {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <h1 className="signup-title">Create an account</h1>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={(e) => handleFinalSubmit(e, 'student')} className="signup-form">
            <div className="form-group">
              <label>Add Photo</label>
              <div className="photo-upload-wrapper">
                <div
                  className="photo-upload-circle"
                  onClick={() => document.getElementById('student-photo-input').click()}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} alt="Profile" className="photo-preview" />
                  ) : (
                    <span className="photo-plus-icon">+</span>
                  )}
                </div>
                <span
                  className="photo-upload-text"
                  onClick={() => document.getElementById('student-photo-input').click()}
                >
                  Add photo
                </span>
                <input
                  id="student-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="photo-input-hidden"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>About</label>
              <textarea
                name="about"
                placeholder="Tell us about yourself"
                value={formData.about}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <button type="submit" className="create-account-btn">
              Finish
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==============================
  // STEP 2 — Teacher Details
  // ==============================
  if (step === 2 && role === 'teacher') {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <h1 className="signup-title">Create an account</h1>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleTeacherStep2Submit} className="signup-form">
            <div className="form-group">
              <label>Add Photo</label>
              <div className="photo-upload-wrapper">
                <div
                  className="photo-upload-circle"
                  onClick={() => document.getElementById('teacher-photo-input').click()}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} alt="Profile" className="photo-preview" />
                  ) : (
                    <span className="photo-plus-icon">+</span>
                  )}
                </div>
                <span
                  className="photo-upload-text"
                  onClick={() => document.getElementById('teacher-photo-input').click()}
                >
                  Add photo
                </span>
                <input
                  id="teacher-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="photo-input-hidden"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>About</label>
              <textarea
                name="about"
                placeholder="Tell us about yourself"
                value={formData.about}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Education</label>
              <textarea
                name="education"
                placeholder="Add your education and credentials"
                value={formData.education}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Experience</label>
              <textarea
                name="experience"
                placeholder="Add your teaching experience"
                value={formData.experience}
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <button type="submit" className="create-account-btn">
              Next
            </button>
          </form>
        </div>
      </div>
    );
  }

 // ==============================
  // STEP 3 — Teacher VISA
  // ==============================
  if (step === 3 && role === 'teacher') {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <h1 className="signup-title">Add Card</h1>
          {error && <div className="error-message">{error}</div>}

          <div className="card-details" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Card Type</label>
              <select
                value={cardData.cardType || ''}
                onChange={(e) => setCardData(prev => ({ ...prev, cardType: e.target.value }))}
              >
                <option value="">Select card type</option>
                <option value="VISA">VISA</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Meeza">Meeza</option>
                <option value="American Express">American Express</option>
              </select>
            </div>

            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={cardData.cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                  const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                  setCardData(prev => ({ ...prev, cardNumber: formatted }));
                }}
              />
            </div>
            <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardData.cvv || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCardData(prev => ({ ...prev, cvv: val }));
                    }}
                    style={{ maxWidth: '120px' }}
                  />
                </div>
            <div className="form-group">
              <label>Name on card</label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardData.nameOnCard}
                onChange={(e) => setCardData(prev => ({ ...prev, nameOnCard: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Bank Name</label>
              <select
                value={cardData.bankName}
                onChange={(e) => setCardData(prev => ({ ...prev, bankName: e.target.value }))}
              >
                <option value="">Select bank</option>
                <option value="CIB">CIB</option>
                <option value="NBE">NBE - National Bank of Egypt</option>
                <option value="QNB">QNB</option>
                <option value="HSBC">HSBC</option>
                <option value="Banque Misr">Banque Misr</option>
                <option value="Alex Bank">Alex Bank</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <label className="save-card-label">
              <input
                type="checkbox"
                checked={cardData.saveCard}
                onChange={(e) => setCardData(prev => ({ ...prev, saveCard: e.target.checked }))}
              />
              Securely save this card
            </label>
          </div>

          <button
            type="button"
            className="create-account-btn"
            onClick={(e) => handleFinalSubmit(e, 'teacher')}
          >
            Finish
          </button>

        
        </div>
      </div>
    );
  }

  return null;
}

export default Signup;
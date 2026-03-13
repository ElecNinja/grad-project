import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import "./Signup.css";
import { signupUser } from '../../apis/handlers/signupUser';
import { useDispatch } from 'react-redux';
import { setLoader } from '../../redux/loaderSlice.js';

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: email/password, Step 2: details
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    // Step 1 data
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2 data (common)
    photo: null,
    name: '',
    phone: '',
    about: '',
    // Teacher specific
    education: '',
    experience: '',
    // Payment details
    cardNumber: '',
    cardName: '',
    bankName: '',
    cvv: '',
    saveCard: false
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
    if (file) {
      setFormData(prev => ({ ...prev, photo: URL.createObjectURL(file) }));
    }
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const validateStudentStep2 = () => {
    if (!formData.name || !formData.phone || !formData.about) {
      setError('Please fill in all fields');
      return false;
    }
    return true;
  };

  const validateTeacherStep2 = () => {
    if (!formData.name || !formData.phone || !formData.about || !formData.education || !formData.experience) {
      setError('Please fill in all fields');
      return false;
    }
    return true;
  };

  const validatePaymentStep = () => {
    if (!formData.cardNumber || !formData.cardName || !formData.cvv) {
      setError('Please fill in all payment details');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleStudentSubmit = async (e) => {
  e.preventDefault();
  if (!validateStudentStep2()) return;

  dispatch(setLoader(true));

  const result = await signupUser({
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone,
    about: formData.about,
    photo: formData.photo,
    role: 'student',
  });

  dispatch(setLoader(false));

  if (result.response) {
    navigate('/login'); // أو navigate('/') حسب التصميم
  } else {
    setError(result.message);
  }
};

  const handleTeacherStep2Submit = (e) => {
    e.preventDefault();
    if (!validateTeacherStep2()) return;
    setStep(3);
  };

 const handlePaymentSubmit = async (e) => {
  e.preventDefault();
  if (!validatePaymentStep()) return;

  dispatch(setLoader(true));

  const result = await signupUser({
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone,
    about: formData.about,
    photo: formData.photo,
    role: 'teacher',
    education: formData.education,
    experience: formData.experience,
  });

  dispatch(setLoader(false));

  if (result.response) {
    navigate('/login');
  } else {
    setError(result.message);
  }
};

  // Step 1: Email and Password
  if (step === 1) {
    return (
      <div className="signup-container">
        <div className="signup-card">
          {/* Role Toggle Buttons */}
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
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="login-text">
            Already Have An Account ? <Link to="/login" className="login-link">Log In</Link>
          </p>
        </div>
      </div>
    );
  }

 // Step 2: Student Details
if (step === 2 && role === 'student') {
  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Create an account</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleStudentSubmit} className="signup-form">
          <div className="form-group">
            <label>Add Photo</label>
            <div className="photo-upload-wrapper">
              <div className="photo-upload-circle" onClick={() => document.getElementById('student-photo-input').click()}>
                {formData.photo ? (
                  <img src={formData.photo} alt="Profile" className="photo-preview" />
                ) : (
                  <span className="photo-plus-icon">+</span>
                )}
              </div>
              <span className="photo-upload-text" onClick={() => document.getElementById('student-photo-input').click()}>
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
              placeholder="Enter your Name"
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
              placeholder="Enter your About"
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

  // Step 2: Teacher Details
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
              <div className="photo-upload-circle" onClick={() => document.getElementById('teacher-photo-input').click()}>
                {formData.photo ? (
                  <img src={formData.photo} alt="Profile" className="photo-preview" />
                ) : (
                  <span className="photo-plus-icon">+</span>
                )}
              </div>
              <span className="photo-upload-text" onClick={() => document.getElementById('teacher-photo-input').click()}>
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
              placeholder="Enter your Name"
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
              placeholder="Enter your About"
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
              placeholder="Add your Credentials here"
              value={formData.education}
              onChange={handleChange}
              rows="3"
              required
            />
            <button 
              type="button" 
              className="add-certificate-btn"
              onClick={() => {/* Add certificate functionality */}}
            >
              <span className="plus-icon">+</span>
              Add your certificates
            </button>
          </div>

          <div className="form-group">
            <label>Experience</label>
            <textarea
              name="experience"
              placeholder="Add your Credentials here"
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

  // Step 3: Teacher Payment Details
  if (step === 3 && role === 'teacher') {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <h1 className="signup-title">Add VISA</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handlePaymentSubmit} className="signup-form">
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                name="cardNumber"
                placeholder="Enter card number"
                value={formData.cardNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Name on card</label>
              <input
                type="text"
                name="cardName"
                placeholder="Enter name on card"
                value={formData.cardName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>CVV/CVC</label>
              <input
                type="text"
                name="cvv"
                placeholder="Enter CVV"
                value={formData.cvv}
                onChange={handleChange}
                required
                maxLength="4"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="saveCard"
                  checked={formData.saveCard}
                  onChange={handleChange}
                />
                <span>Securely save this card</span>
              </label>
            </div>

            <button type="submit" className="create-account-btn">
              Finish
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

export default Signup;
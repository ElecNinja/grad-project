import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { setLoader } from '../../redux/loaderSlice.js';
import useIsComponentMounted from "../../hooks/useIsComponentMounted.js";
import { signupUser } from '../../apis/handlers/signupUser.js';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import SuccessMessage from '../../components/SuccessMessage/SuccessMessage.jsx';
import "./Signup.css";

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isComponentMounted = useIsComponentMounted();

  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (success !== '') {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const requestData = {
      email: formData.email,
      password: formData.password,
      role: role
    };

    setIsLoading(true);
    dispatch(setLoader(true));
    setError('');
    setSuccess('');

    signupUser(requestData)
      .then(res => {
        if (isComponentMounted) {
          if (res.response) {
            setSuccess("Account created successfully! Redirecting to login...");
          } else {
            setError(res.message || 'Signup failed. Please try again.');
          }
        }
      })
      .catch(error => {
        setError('An unexpected error occurred');
        console.error("Error in signup function.", error);
      })
      .finally(() => {
        setIsLoading(false);
        dispatch(setLoader(false));
      });
  };

  const handleGoogleSignup = () => {
    // Implement Google signup logic
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create an account</h1>
          <p>Join StudyBuddy today</p>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-button ${role === "student" ? "active" : ""}`}
            onClick={() => setRole("student")}
            disabled={isLoading}
          >
            <span className="role-icon">🎓</span>
            Student
          </button>
          <button
            type="button"
            className={`role-button ${role === "expert" ? "active" : ""}`}
            onClick={() => setRole("expert")}
            disabled={isLoading}
          >
            <span className="role-icon">👨‍🏫</span>
            Expert
          </button>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
        {success && <SuccessMessage message={success} />}

        <form onSubmit={handleSubmit} className="signup-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className={error && !formData.email ? 'error' : ''}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                className={error && !formData.password ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="password-input-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className={error && formData.password !== formData.confirmPassword ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="terms-checkbox">
            <label className="checkbox-wrapper">
              <input type="checkbox" required disabled={isLoading} />
              <span className="checkbox-text">
                I agree to the <Link to="/terms" className="terms-link">Terms of Service</Link> and <Link to="/privacy" className="terms-link">Privacy Policy</Link>
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button 
            type="button" 
            className="google-button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </form>

        <p className="login-prompt">
          Already have an account? <Link to="/login" className="login-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
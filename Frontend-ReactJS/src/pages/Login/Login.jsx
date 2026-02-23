import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { INPUT_LENGTH } from "../../utils/constants.js";
import { setLoader } from '../../redux/loaderSlice.js';
import useIsComponentMounted from "../../hooks/useIsComponentMounted.js";
import { loginUser } from '../../apis/handlers/loginUser.js';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import "./Login.css";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isComponentMounted = useIsComponentMounted();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    dispatch(setLoader(true));

    try {
      const res = await loginUser({ ...formData, remember });
      if (isComponentMounted) {
        if (res.response) {
          navigate('/dashboard');
        } else {
          setError(res.message || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error("Error in login function.", error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      dispatch(setLoader(false));
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google login logic
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome back</h1>
          <p>Please enter your details to sign in</p>
        </div>

        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              minLength={INPUT_LENGTH.email.minValue}
              maxLength={INPUT_LENGTH.email.maxValue}
              required
              className={error && !formData.email ? 'error' : ''}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
            
            <div className="password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength={INPUT_LENGTH.password.minValue}
                maxLength={INPUT_LENGTH.password.maxValue}
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

          <div className="form-options">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-text">Remember me</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button 
            type="button" 
            className="google-button"
            onClick={handleGoogleLogin}
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

        <p className="signup-prompt">
          Don't have an account? <Link to="/signup" className="signup-link">Create free account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
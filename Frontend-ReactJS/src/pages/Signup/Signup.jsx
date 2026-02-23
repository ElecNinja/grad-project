import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { setLoader } from '../../redux/loaderSlice.js';
import useIsComponentMounted from "../../hooks/useIsComponentMounted.js";
import { signupUser } from '../../apis/handlers/signupUser.js';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import SuccessMessage from '../../components/SuccessMessage/SuccessMessage.jsx';
import "./Signup.css";

/**
 * Component returns signup page.
 * 
 * @returns {React.ReactElement}
 */

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isComponentMounted = useIsComponentMounted();

  const [role, setRole] = useState("student");

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const requestData = {
      email: formData.email,
      password: formData.password,
      role: role
    };

    dispatch(setLoader(true));
    setError('');
    setSuccess('');

    signupUser(requestData)
      .then(res => {
        if (isComponentMounted) {
          if (res.response) {
            setSuccess("Account created successfully. Redirecting...");
          } else {
            setError(res.message);
          }
        }
      })
      .finally(() => dispatch(setLoader(false)));
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-card">

        <div className="top-bar">
          StudyBuddy
        </div>

        <div className="signup-content">

          <div className="role-toggle">
            <button
              className={role === "student" ? "active" : ""}
              onClick={() => setRole("student")}
              type="button"
            >
              Student
            </button>

            <button
              className={role === "expert" ? "active" : ""}
              onClick={() => setRole("expert")}
              type="button"
            >
              Expert
            </button>
          </div>

          <h2>Create an account</h2>

          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          <form onSubmit={handleSubmit} className="form-container">

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button className="primary-btn" type="submit">
              Create Account
            </button>

            <button type="button" className="google-btn">
              Continue with Google
            </button>

          </form>

          <p className="login-text">
            Already Have An Account? <Link to="/login">Log in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Signup;


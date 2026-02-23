import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { INPUT_LENGTH } from "../../utils/constants.js";
import { setLoader } from '../../redux/loaderSlice.js';
import useIsComponentMounted from "../../hooks/useIsComponentMounted.js";
import { loginUser } from '../../apis/handlers/loginUser.js';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx';
import "./Login.css";
/**
 * Component returns login page.
 * 
 * @returns {React.ReactElement}
 */


function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isComponentMounted = useIsComponentMounted();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestData = { email, password, remember };

    dispatch(setLoader(true));

    loginUser(requestData)
      .then(res => {
        if (isComponentMounted) {
          if (res.response) navigate('/dashboard');
          else setError(res.message);
        }
      })
      .catch(error => console.error("Error in login function.", error))
      .finally(() => dispatch(setLoader(false)));
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        <div className="top-bar">
          <div className="logo">StudyBuddy</div>
        </div>

        <div className="login-content">

          <h2>Login to your account</h2>

          {error && <ErrorMessage message={error} />}

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Email</label>
              <input
                autoComplete="email"
                type="email"
                placeholder="Enter your email"
                minLength={INPUT_LENGTH.email.minValue}
                maxLength={INPUT_LENGTH.email.maxValue}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="password-row">
                <label>Password</label>
                <span className="forgot">Forgot?</span>
              </div>

              <input
                autoComplete="current-password"
                type="password"
                placeholder="Enter your password"
                minLength={INPUT_LENGTH.password.minValue}
                maxLength={INPUT_LENGTH.password.maxValue}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button className="primary-btn" type="submit">
              Login now
            </button>

            <button type="button" className="google-btn">
              Continue with Google
            </button>

          </form>

          <p className="signup-text">
            Don’t have an account? <Link to="/signup">Sign Up</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;
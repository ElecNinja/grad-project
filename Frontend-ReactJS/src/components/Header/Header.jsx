import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from "react-redux";
import "./header.css"

/**
 * Component returns nav component.
 * 
 * @returns {React.ReactElement}
 */


function Header() {
  const user = useSelector((state) => state.user);

  return (
    <nav className="navbar">
      <div className="nav-container">
        
        {/* Left Side */}
        <div className="nav-left">
          <NavLink to="/" className="logo">
            StudyBuddy
          </NavLink>

          <ul className="nav-main-links">
            <li>
              <NavLink to="/find-expert" className="nav-link">
                Find Expert
              </NavLink>
            </li>
            <li>
              <NavLink to="/add-material" className="nav-link">
                Add Material
              </NavLink>
            </li>
            <li>
              <NavLink to="/Bootcamp" className="nav-link">
                Boot Camp
              </NavLink>
            </li>
            <li>
              <NavLink to="/Work" className="nav-link">
                Work
              </NavLink>
            </li>
            <li>
              <NavLink to="Offer" className="nav-link">
                Offer
              </NavLink>
            </li>
            <li>
              More
            </li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="nav-right">
          {!user?.loggedIn && (
            <>
              <NavLink to="/login" className="nav-link">
                Login
              </NavLink>

              <NavLink to="/signup" className="btn-primary">
                JOIN US
              </NavLink>
            </>
          )}

          {user?.loggedIn && (
            <>
              <NavLink to="/dashboard" className="nav-link">
                Dashboard
              </NavLink>

              <button className="btn-outline">
                Logout
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Header;
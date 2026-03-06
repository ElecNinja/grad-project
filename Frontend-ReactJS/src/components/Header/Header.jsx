import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from "react-redux";
import { ChevronDown, Menu, X } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import "./header.css"

function Header() {
  const user = useSelector((state) => state.user);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const moreLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-container">
        
        {/* Left Side */}
        <div className="nav-left">
          <NavLink to="/" className="logo">
            <img src={logo} alt="StudyBuddy" className="logo-img" />
            <span className="logo-text">StudyBuddy</span>
          </NavLink>

          {/* Desktop Menu */}
          <ul className="nav-main-links desktop-menu">
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
              <NavLink to="/Offers" className="nav-link">
                Offer
              </NavLink>
            </li>
            <li className="more-dropdown" ref={dropdownRef}>
              <button 
                className="more-button" 
                onClick={() => setIsMoreOpen(!isMoreOpen)}
              >
                More <ChevronDown size={16} className={`chevron ${isMoreOpen ? 'rotated' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isMoreOpen && (
                <div className="dropdown-menu">
                  {moreLinks.map((link, index) => (
                    <NavLink 
                      key={index}
                      to={link.path} 
                      className="dropdown-item"
                      onClick={() => setIsMoreOpen(false)}
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </div>
              )}
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

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <NavLink to="/find-expert" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Find Expert
          </NavLink>
          <NavLink to="/add-material" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Add Material
          </NavLink>
          <NavLink to="/Bootcamp" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Boot Camp
          </NavLink>
          <NavLink to="/Work" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Work
          </NavLink>
          <NavLink to="/Offer" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Offer
          </NavLink>
          <div className="mobile-divider"></div>
          <NavLink to="/about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            About Us
          </NavLink>
          <NavLink to="/help" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Help Center
          </NavLink>
          <NavLink to="/contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Contact Us
          </NavLink>
          <div className="mobile-divider"></div>
          <NavLink to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Login
          </NavLink>
          <NavLink to="/signup" className="mobile-nav-link highlight" onClick={() => setIsMobileMenuOpen(false)}>
            JOIN US
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Header;
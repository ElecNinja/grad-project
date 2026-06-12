import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import { ChevronDown, Menu, X, Bell, LogOut } from 'lucide-react';
import { logoutUser } from '../../apis/handlers/logoutUser';
import PopupMessage from '../popup/popupmessage';
import logo from '../../assets/images/logo.png';
import "./header.css"

function Header() {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const moreLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
  ];
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

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

            {/* Logged OUT: Work & Offers */}
            {!user?.loggedIn && (
              <>
                <li>
                  <NavLink to="/work" className="nav-link">
                    Work
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/Offers" className="nav-link">
                    Offers
                  </NavLink>
                </li>
              </>
            )}

            {/* Logged in as STUDENT: Requests & Videos */}
            {user?.loggedIn && user?.role === 'student' && (
              <>
                <li>
                  <NavLink to="/requests" className="nav-link">
                    Requests
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/videos" className="nav-link">
                    Videos
                  </NavLink>
                </li>
              </>
            )}

            {/* Logged in as TEACHER: Work & Offers */}
            {user?.loggedIn && user?.role === 'teacher' && (
              <>
                <li>
                  <NavLink to="/work" className="nav-link">
                    Work
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/Offers" className="nav-link">
                    Offers
                  </NavLink>
                </li>
              </>
            )}

            <li className="more-dropdown" ref={dropdownRef}>
              <button
                className="more-button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
              >
                More <ChevronDown size={16} className={`chevron ${isMoreOpen ? 'rotated' : ''}`} />
              </button>
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
              <div className="bell-wrapper" ref={bellRef}>
                <button
                  type="button"
                  className="bell-btn"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="bell-dot" />}
                </button>
                <PopupMessage
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  recipientId={user?.id}
                  anchorRef={bellRef}
                  onUnreadCountChange={setUnreadCount}
                />
              </div>
              <button type="button" className="btn-logout" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
              <NavLink
                to={user?.role === 'teacher' ? '/teacher-profile' : '/student-profile'}
                className="btn-primary"
              >
                My Profile
              </NavLink>
              <div className="user-info">
                <span className="user-name">{user?.name || user?.profile?.full_name || 'Alex Johnson'}</span>
                <span className="user-role">{user?.role || 'STUDENT'}</span>
              </div>
              <div className="user-avatar">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="avatar-img"/>
                  : <span className="avatar-letter">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
                }
              </div>
            </>
          )}

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

          {/* Logged OUT: Work & Offers */}
          {!user?.loggedIn && (
            <>
              <NavLink to="/work" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Work
              </NavLink>
              <NavLink to="/Offers" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Offers
              </NavLink>
            </>
          )}

          {/* Logged in as STUDENT: Requests & Videos */}
          {user?.loggedIn && user?.role === 'student' && (
            <>
              <NavLink to="/requests" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Requests
              </NavLink>
              <NavLink to="/videos" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Videos
              </NavLink>
            </>
          )}

          {/* Logged in as TEACHER: Work & Offers */}
          {user?.loggedIn && user?.role === 'teacher' && (
            <>
              <NavLink to="/work" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Work
              </NavLink>
              <NavLink to="/Offers" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Offers
              </NavLink>
              <NavLink to="/teacher-profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                My Profile
              </NavLink>
            </>
          )}

          {user?.loggedIn && user?.role === 'student' && (
            <NavLink to="/student-profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              My Profile
            </NavLink>
          )}

          {user?.loggedIn && (
            <button type="button" className="mobile-logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}

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
          {!user?.loggedIn && (
            <>
              <NavLink to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/signup" className="mobile-nav-link highlight" onClick={() => setIsMobileMenuOpen(false)}>
                JOIN US
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
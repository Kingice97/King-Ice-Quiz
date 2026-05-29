import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { FaHome, FaBook, FaComments, FaChartBar, FaCog, FaUser, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaBars, FaTimes, FaWhatsapp, FaEnvelope, FaCrown, FaKey } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const contactInfo = {
    email: 'olubiyiisaacanu@gmail.com',
    whatsappUrl: 'https://wa.me/2348145659286',
    twitterUrl: 'https://x.com/KingIceQuizApp?s=09'
  };

  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Home', show: true },
    { path: '/super-admin', icon: <FaCrown />, label: 'Command Center', show: isAuthenticated && user?.isSuperAdmin },
    { path: '/join', icon: <FaKey />, label: 'Join Quiz', show: !isAdmin && !user?.isSuperAdmin },
    { path: '/quizzes', icon: <FaBook />, label: 'Browse Quizzes', show: !isAdmin && !user?.isSuperAdmin },
    { path: '/chat', icon: <FaComments />, label: 'Chat Room', show: true },
    { path: '/dashboard', icon: <FaChartBar />, label: 'My Dashboard', show: isAuthenticated && !isAdmin && !user?.isSuperAdmin },
    { path: '/admin', icon: <FaCog />, label: 'Admin Panel', show: isAuthenticated && isAdmin && !user?.isSuperAdmin },
    { path: '/profile', icon: <FaUser />, label: 'My Profile', show: isAuthenticated },
  ];

  const NavLink = ({ path, icon, label, mobile = false }) => (
    <Link 
      to={path}
      className={`nav-link ${isActiveLink(path) ? 'active' : ''}`}
      onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-text">{label}</span>
      {isActiveLink(path) && <span className="active-dot" />}
    </Link>
  );

  return (
    <>
      {/* ==================== MOBILE HEADER ==================== */}
      <nav className="navbar mobile-navbar">
        <div className="navbar-container">
          <div className="navbar-header">
            <Link to="/" className="navbar-brand">
              <img src="/brain-icon.png" alt="King Ice Quiz" className="brand-logo" />
              <span className="brand-text">King Ice Quiz</span>
            </Link>

            <button 
              className="theme-toggle-icon"
              onClick={toggleTheme}
              aria-label={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>
      </nav>

      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link to="/" className="brand-link">
            <img src="/brain-icon.png" alt="King Ice Quiz" className="brand-logo" />
            <div className="brand-info">
              <span className="brand-name">King Ice Quiz</span>
              <span className="brand-tagline">Learn. Compete. Grow.</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">MAIN MENU</span>
          {navItems.filter(item => item.show).map(item => (
            <NavLink key={item.path} {...item} />
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-switch" onClick={toggleTheme}>
            <span className="theme-switch-icon">{isDark ? <FaSun /> : <FaMoon />}</span>
            <span className="theme-switch-text">{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
            <span className="theme-switch-track">
              <span className={`theme-switch-thumb ${isDark ? 'dark' : ''}`} />
            </span>
          </button>

          {isAuthenticated ? (
            <div className="sidebar-user-section">
              <div className="user-card">
                <div className="user-avatar">
                  {user?.profile?.picture ? (
                    <img src={user.profile.picture} alt={user.username} />
                  ) : (
                    user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="user-meta">
                  <span className="user-display-name">{user?.username}</span>
                 <span className="user-role-badge">
  {user?.isSuperAdmin && <><FaCrown /> Super Admin</>}
  {isAdmin && !user?.isSuperAdmin && <>Admin</>}
  {!isAdmin && !user?.isSuperAdmin && 'Learner'}
</span>
                </div>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          ) : (
            <div className="sidebar-auth-buttons">
              <Link to="/login" className="btn btn-outline btn-block">
                <FaSignInAlt /> Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-block">
                <FaUserPlus /> Create Free Account
              </Link>
            </div>
          )}

          <div className="sidebar-social">
            <span className="social-heading">Connect With Us</span>
            <div className="social-icons-row">
              <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="social-circle whatsapp" title="WhatsApp">
                <FaWhatsapp />
              </a>
              <a href={contactInfo.twitterUrl} target="_blank" rel="noopener noreferrer" className="social-circle twitter" title="X (Twitter)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href={`mailto:${contactInfo.email}`} className="social-circle email" title="Email">
                <FaEnvelope />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FaHome, FaBook, FaComments, FaUser, FaEllipsisH, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaChartBar, FaCog, FaWhatsapp, FaEnvelope, FaCrown, FaTimes, FaKey } from 'react-icons/fa';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMorePanel, setShowMorePanel] = useState(false);

  // Hide bottom nav on chat page (full screen)
  const isChatPage = location.pathname === '/chat';
  if (isChatPage) return null;

  // Hide on login/register pages
  const authPages = ['/login', '/register'];
  if (authPages.includes(location.pathname)) return null;

  const contactInfo = {
    email: 'olubiyiisaacanu@gmail.com',
    whatsappUrl: 'https://wa.me/2348145659286',
    twitterUrl: 'https://x.com/KingIceQuizApp?s=09'
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMorePanel(false);
  };

  // User avatar component
  const UserAvatar = () => (
    <div className="nav-user-avatar">
      {user?.profile?.picture ? (
        <img src={user.profile.picture} alt={user.username} />
      ) : (
        user?.username?.charAt(0).toUpperCase()
      )}
    </div>
  );

  const tabs = [
    { path: '/', icon: <FaHome />, label: 'Home', show: true },
    { path: '/join', icon: <FaKey />, label: 'Join', show: !isAdmin && !user?.isSuperAdmin },
    { path: '/quizzes', icon: <FaBook />, label: 'Quizzes', show: !isAdmin && !user?.isSuperAdmin },
    { path: '/chat', icon: <FaComments />, label: 'Chat', show: true, badge: true },
    { 
      path: '/profile', 
      icon: isAuthenticated ? <UserAvatar /> : <FaUser />, 
      label: 'Profile', 
      show: true 
    },
    { 
      path: null, 
      icon: <FaEllipsisH />, 
      label: 'More', 
      show: true,
      onClick: () => setShowMorePanel(true)
    },
  ];

  return (
    <>
      <nav className="mobile-bottom-nav">
        {tabs.filter(tab => tab.show).map(tab => (
          tab.path ? (
            <NavLink 
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setShowMorePanel(false)}
            >
              <span className="bottom-nav-icon">
                {tab.icon}
                {tab.badge && <span className="nav-badge-dot" />}
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
            </NavLink>
          ) : (
            <button 
              key="more"
              className="bottom-nav-item"
              onClick={tab.onClick}
            >
              <span className="bottom-nav-icon">{tab.icon}</span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          )
        ))}
      </nav>

      {/* More Panel Overlay */}
      {showMorePanel && (
        <div className="more-panel-overlay" onClick={() => setShowMorePanel(false)} />
      )}

      {/* More Panel */}
      <div className={`more-panel ${showMorePanel ? 'active' : ''}`}>
        <div className="more-panel-header">
          <h3>Menu</h3>
          <button className="more-panel-close" onClick={() => setShowMorePanel(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="more-panel-content">
          {/* User Info */}
          {isAuthenticated ? (
            <div className="more-user-card">
              <div className="more-user-avatar">
                {user?.profile?.picture ? (
                  <img src={user.profile.picture} alt={user.username} />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="more-user-info">
                <span className="more-user-name">{user?.username}</span>
                <span className="more-user-role">
                  {user?.isSuperAdmin && <><FaCrown /> Super Admin</>}
                  {isAdmin && !user?.isSuperAdmin && <>Admin</>}
                  {!isAdmin && !user?.isSuperAdmin && 'Learner'}
                </span>
              </div>
            </div>
          ) : (
            <div className="more-auth-buttons">
              <button className="more-btn more-btn-primary" onClick={() => { navigate('/register'); setShowMorePanel(false); }}>
                <FaUserPlus /> Create Free Account
              </button>
              <button className="more-btn more-btn-outline" onClick={() => { navigate('/login'); setShowMorePanel(false); }}>
                <FaSignInAlt /> Sign In
              </button>
            </div>
          )}

          {/* Quick Links */}
          <div className="more-links">
            {isAuthenticated && user?.isSuperAdmin && (
              <button className="more-link" onClick={() => { navigate('/super-admin'); setShowMorePanel(false); }}>
                <FaCrown /> Command Center
              </button>
            )}
            {isAuthenticated && isAdmin && !user?.isSuperAdmin && (
              <button className="more-link" onClick={() => { navigate('/admin'); setShowMorePanel(false); }}>
                <FaCog /> Admin Panel
              </button>
            )}
            {isAuthenticated && !isAdmin && !user?.isSuperAdmin && (
              <button className="more-link" onClick={() => { navigate('/dashboard'); setShowMorePanel(false); }}>
                <FaChartBar /> Dashboard
              </button>
            )}
            {isAuthenticated && (
              <button className="more-link more-link-danger" onClick={handleLogout}>
                <FaSignOutAlt /> Sign Out
              </button>
            )}
          </div>

          {/* Social Links */}
          <div className="more-social">
            <span className="more-social-title">Connect With Us</span>
            <div className="more-social-icons">
              <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="more-social-circle whatsapp">
                <FaWhatsapp />
              </a>
              <a href={contactInfo.twitterUrl} target="_blank" rel="noopener noreferrer" className="more-social-circle twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href={`mailto:${contactInfo.email}`} className="more-social-circle email">
                <FaEnvelope />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
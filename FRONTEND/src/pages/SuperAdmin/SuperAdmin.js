import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import { FaCrown, FaUsers, FaUserShield, FaEdit, FaChartLine, FaChartBar, FaTrophy, FaUser, FaEnvelope, FaCalendar, FaKey, FaLock, FaGlobe } from 'react-icons/fa';
import './SuperAdmin.css';

const SuperAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dashboardData, loading: dashboardLoading } = useApi(() =>
    userService.getSuperAdminDashboard()
  );

  const { data: quizzesData, loading: quizzesLoading } = useApi(() =>
    quizService.getSuperAdminQuizzes()
  );

  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    quizService.getSuperAdminResults()
  );

  const { data: usersData, loading: usersLoading } = useApi(() =>
    userService.getSuperAdminUsers()
  );

  const stats = dashboardData?.data?.stats || {};
  const admins = dashboardData?.data?.admins || [];
  const allQuizzes = quizzesData?.data || [];
  const allResults = resultsData?.data || [];
  const allUsers = usersData?.data || [];
  const recentUsers = dashboardData?.data?.recentUsers || [];
  const recentResults = dashboardData?.data?.recentResults || [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  if (!user?.isSuperAdmin) {
    return (
      <div className="super-admin-error">
        <h2><FaCrown /> Access Denied</h2>
        <p>Super Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="super-admin-page">
      <Helmet>
        <title>Super Admin Dashboard - King Ice Quiz</title>
      </Helmet>

      <div className="super-admin-container">
        {/* Header */}
        <div className="sa-header">
          <div className="sa-header-content">
            <div className="sa-title">
              <FaCrown className="sa-crown-icon" />
              <div>
                <h1>Super Admin Command Center</h1>
                <p>Complete platform control & analytics</p>
              </div>
            </div>
            <div className="sa-header-stats">
              <div className="sa-header-stat">
                <FaUserShield />
                <span>{stats.totalAdmins || admins.length || 0} Admins</span>
              </div>
              <div className="sa-header-stat">
                <FaUsers />
                <span>{stats.totalRegularUsers || stats.totalUsers || 0} Users</span>
              </div>
              <div className="sa-header-stat">
                <FaEdit />
                <span>{stats.totalQuizzes || 0} Quizzes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sa-tabs">
          <button className={`sa-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <FaChartBar /> Overview
          </button>
          <button className={`sa-tab ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')}>
            <FaUserShield /> Admins ({admins.length})
          </button>
          <button className={`sa-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <FaUsers /> All Users ({allUsers.length})
          </button>
          <button className={`sa-tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
            <FaEdit /> All Quizzes ({allQuizzes.length})
          </button>
          <button className={`sa-tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <FaChartLine /> All Results ({allResults.length})
          </button>
        </div>

        {/* Tab Content */}
        {dashboardLoading ? <Loading text="Loading super admin data..." /> : (
          <div className="sa-content">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="sa-overview">
                <div className="sa-big-stats">
                  <div className="sa-big-stat gold">
                    <FaCrown />
                    <span className="sa-big-number">{stats.totalAdmins || admins.length || 0}</span>
                    <span className="sa-big-label">Total Admins</span>
                  </div>
                  <div className="sa-big-stat blue">
                    <FaUsers />
                    <span className="sa-big-number">{stats.totalRegularUsers || stats.totalUsers || 0}</span>
                    <span className="sa-big-label">Total Users</span>
                  </div>
                  <div className="sa-big-stat purple">
                    <FaEdit />
                    <span className="sa-big-number">{stats.totalQuizzes || 0}</span>
                    <span className="sa-big-label">Total Quizzes</span>
                  </div>
                  <div className="sa-big-stat green">
                    <FaChartLine />
                    <span className="sa-big-number">{stats.totalResults || 0}</span>
                    <span className="sa-big-label">Total Attempts</span>
                  </div>
                </div>

                <div className="sa-card">
                  <h3><FaGlobe /> Quiz Breakdown</h3>
                  <div className="sa-breakdown">
                    <div className="sa-breakdown-item">
                      <FaLock /> Private Quizzes: <strong>{stats.totalPrivateQuizzes || 0}</strong>
                    </div>
                    <div className="sa-breakdown-item">
                      <FaGlobe /> Public Quizzes: <strong>{stats.totalPublicQuizzes || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="sa-card">
                  <h3><FaUsers /> Recent Registrations</h3>
                  <div className="sa-table-wrapper">
                    <div className="sa-table sa-table-4col">
                      <div className="sa-table-header">
                        <span>User</span><span>Email</span><span>Role</span><span>Joined</span>
                      </div>
                      {recentUsers.map(u => (
                        <div key={u._id} className="sa-table-row">
                          <span><strong>{u.username}</strong></span>
                          <span className="sa-ellipsis">{u.email}</span>
                          <span className={`sa-badge ${u.role}`}>{u.role}</span>
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sa-card">
                  <h3><FaChartLine /> Recent Quiz Attempts</h3>
                  <div className="sa-table-wrapper">
                    <div className="sa-table sa-table-4col">
                      <div className="sa-table-header">
                        <span>User</span><span>Quiz</span><span>Score</span><span>Date</span>
                      </div>
                      {recentResults.slice(0, 10).map(r => (
                        <div key={r._id} className="sa-table-row">
                          <span>{r.userId?.username || 'N/A'}</span>
                          <span className="sa-ellipsis">{r.quizId?.title || 'N/A'}</span>
                          <span className={`sa-badge ${r.passed ? 'passed' : 'failed'}`}>{Math.round(r.percentage || 0)}%</span>
                          <span>{formatDate(r.completedAt || r.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMINS TAB */}
            {activeTab === 'admins' && (
              <div className="sa-card">
                <h3><FaUserShield /> All Admins</h3>
                <div className="sa-table-wrapper">
                  <div className="sa-table sa-table-7col">
                    <div className="sa-table-header">
                      <span>Admin</span><span>Email</span><span>Quizzes</span><span>Private</span><span>Results</span><span>Status</span><span>Joined</span>
                    </div>
                    {admins.map(admin => (
                      <div key={admin._id} className="sa-table-row">
                        <span><strong>{admin.username}</strong></span>
                        <span className="sa-ellipsis">{admin.email}</span>
                        <span>{admin.quizCount || 0}</span>
                        <span>{admin.privateQuizCount || 0}</span>
                        <span>{admin.resultCount || 0}</span>
                        <span className={`sa-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span>{formatDate(admin.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="sa-card">
                <h3><FaUsers /> All Users ({allUsers.length})</h3>
                <div className="sa-table-wrapper">
                  <div className="sa-table sa-table-5col">
                    <div className="sa-table-header">
                      <span>User</span><span>Email</span><span>Role</span><span>Status</span><span>Joined</span>
                    </div>
                    {allUsers.map(u => (
                      <div key={u._id} className="sa-table-row">
                        <span>
                          <strong>{u.username}</strong>
                          {u.isSuperAdmin && <FaCrown style={{color: '#f59e0b', marginLeft: 6}} />}
                        </span>
                        <span className="sa-ellipsis">{u.email}</span>
                        <span className={`sa-badge ${u.role}`}>{u.role}</span>
                        <span className={`sa-badge ${u.isActive ? 'active' : 'inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span>{formatDate(u.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* QUIZZES TAB */}
            {activeTab === 'quizzes' && (
              <div className="sa-card">
                <h3><FaEdit /> All Quizzes ({allQuizzes.length})</h3>
                <div className="sa-table-wrapper">
                  <div className="sa-table sa-table-5col">
                    <div className="sa-table-header">
                      <span>Title</span><span>Created By</span><span>Category</span><span>Type</span><span>Attempts</span>
                    </div>
                    {allQuizzes.map(q => (
                      <div key={q._id} className="sa-table-row">
                        <span className="sa-ellipsis"><strong>{q.title}</strong></span>
                        <span>{q.createdBy?.username || 'N/A'}</span>
                        <span>{q.category}</span>
                        <span className={`sa-badge ${q.requiresCode ? 'private' : 'public'}`}>
                          {q.requiresCode ? 'Private' : 'Public'}
                        </span>
                        <span>{q.stats?.timesTaken || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
              <div className="sa-card">
                <h3><FaChartLine /> All Results ({allResults.length})</h3>
                <div className="sa-table-wrapper">
                  <div className="sa-table sa-table-6col">
                    <div className="sa-table-header">
                      <span>User</span><span>Quiz</span><span>Creator</span><span>Score</span><span>Status</span><span>Date</span>
                    </div>
                    {allResults.map(r => (
                      <div key={r._id} className="sa-table-row">
                        <span>{r.userId?.username || r.userName || 'N/A'}</span>
                        <span className="sa-ellipsis">{r.quizId?.title || 'N/A'}</span>
                        <span>{r.quizId?.createdBy?.username || 'N/A'}</span>
                        <span>{Math.round(r.percentage || 0)}%</span>
                        <span className={`sa-badge ${r.passed ? 'passed' : 'failed'}`}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                        <span>{formatDate(r.completedAt || r.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
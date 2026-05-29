import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import { userService } from '../../services/userService';
import QuizForm from '../../components/admin/QuizForm/QuizForm';
import AdminDashboard from '../../components/admin/Dashboard/Dashboard';
import UsersManagement from './UsersManagement';
import Loading from '../../components/common/Loading/Loading';
import Modal from '../../components/common/Modal/Modal';
import { FaChartBar, FaEdit, FaUsers, FaChartLine, FaCrown } from 'react-icons/fa';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin || false;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  // Super admin gets all quizzes, regular admin gets only their own
  const { data: quizzesData, loading: quizzesLoading, setData: setQuizzesData } = useApi(async () => {
    if (isSuperAdmin) {
      return await quizService.getSuperAdminQuizzes();
    }
    try {
      return await quizService.getAdminQuizzes({ limit: 50 });
    } catch (error) {
      return await quizService.getQuizzes({ limit: 50 });
    }
  }, null, [isSuperAdmin]);

  // Super admin gets all results, regular admin gets only their own
  const { data: resultsData, loading: resultsLoading } = useApi(async () => {
    if (isSuperAdmin) {
      return await quizService.getSuperAdminResults();
    }
    try {
      return await quizService.getAdminResults({ limit: 100, sortBy: 'completedAt', sortOrder: 'desc' });
    } catch (error) {
      return await quizService.getAllResults({ limit: 100, sortBy: 'completedAt', sortOrder: 'desc' });
    }
  }, null, [isSuperAdmin]);

  // Super admin gets all users, regular admin gets limited
  const { data: usersData, loading: usersLoading } = useApi(() =>
    isSuperAdmin ? userService.getSuperAdminUsers() : userService.getUsers({ limit: 100 }),
    null, [isSuperAdmin]
  );

  const quizzes = quizzesData?.data || [];
  const recentResults = resultsData?.data || [];
  const users = usersData?.data || [];
  const allAdmins = isSuperAdmin ? users.filter(u => u.role === 'admin' && !u.isSuperAdmin) : [];
  const regularUsers = Array.isArray(users) ? users.filter(u => u.role === 'user') : [];
  const activeRegularUsers = regularUsers.filter(u => u.isActive === true).length;
  
  const adminStats = {
    totalQuizzes: quizzes.length,
    totalUsers: isSuperAdmin ? users.length : regularUsers.length,
    totalAdmins: allAdmins.length,
    totalAttempts: recentResults.length,
    activeUsers: activeRegularUsers,
    averageScore: recentResults.length > 0 
      ? recentResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / recentResults.length 
      : 0
  };

  const handleCreateQuiz = async (quizData) => {
    try {
      const response = await quizService.createQuiz(quizData);
      setQuizzesData(prev => ({
        ...prev,
        data: [response.data, ...(prev?.data || [])]
      }));
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create quiz. Please try again.');
    }
  };

  const handleUpdateQuiz = async (quizData) => {
    try {
      const response = await quizService.updateQuiz(editingQuiz._id, quizData);
      setQuizzesData(prev => ({
        ...prev,
        data: (prev?.data || []).map(quiz => 
          quiz._id === editingQuiz._id ? response.data : quiz
        )
      }));
      setEditingQuiz(null);
    } catch (error) {
      console.error('Failed to update quiz:', error);
      alert('Failed to update quiz. Please try again.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        await quizService.deleteQuiz(quizId);
        setQuizzesData(prev => ({
          ...prev,
          data: (prev?.data || []).filter(quiz => quiz._id !== quizId)
        }));
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        alert('Failed to delete quiz. Please try again.');
      }
    }
  };

  const startEditing = (quiz) => {
    setEditingQuiz(quiz);
  };

  // Allow both admin and super admin
  if (!user || (user.role !== 'admin' && !user.isSuperAdmin)) {
    return (
      <div className="admin-error">
        <div className="container">
          <div className="error-content">
            <h2>Access Denied</h2>
            <p>You need administrator privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Helmet>
        <title>{isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard - King Ice Quiz</title>
        <meta name="description" content="King Ice Quiz administration dashboard" />
      </Helmet>

      <div className="container">
        <div className="admin-header">
          <h1>
            {isSuperAdmin && <FaCrown style={{ color: '#f59e0b', marginRight: '8px' }} />}
            {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p>{isSuperAdmin ? 'Complete platform overview and management' : 'Platform management and user analytics'}</p>
          <div className="admin-actions">
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create New Quiz
            </button>
            <Link to="/admin/users" className="btn btn-outline">
              Manage Users
            </Link>
          </div>
        </div>

        {/* Super Admin Stats Bar */}
        {isSuperAdmin && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="stat-card" style={{ background: '#fef3c7', border: '2px solid #f59e0b' }}>
              <div className="stat-icon"><FaCrown /></div>
              <div className="stat-info">
                <span className="stat-value">{adminStats.totalAdmins}</span>
                <span className="stat-label">Admins</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaUsers /></div>
              <div className="stat-info">
                <span className="stat-value">{regularUsers.length}</span>
                <span className="stat-label">Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaEdit /></div>
              <div className="stat-info">
                <span className="stat-value">{quizzes.length}</span>
                <span className="stat-label">Quizzes</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-info">
                <span className="stat-value">{recentResults.length}</span>
                <span className="stat-label">Results</span>
              </div>
            </div>
          </div>
        )}

        <div className="admin-tabs">
          <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <FaChartBar /> Dashboard
          </button>
          <button className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
            <FaEdit /> Quizzes ({quizzes.length})
          </button>
          <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <FaUsers /> Users ({isSuperAdmin ? users.length : regularUsers.length})
          </button>
          <button className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <FaChartLine /> Results ({recentResults.length})
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              stats={adminStats}
              recentQuizzes={quizzes.slice(0, 5)}
              recentResults={recentResults.slice(0, 10)}
              userLeaderboard={[]}
              isSuperAdmin={isSuperAdmin}
              admins={allAdmins}
            />
          )}

          {activeTab === 'quizzes' && (
            <div className="quizzes-management">
              <div className="management-header">
                <h3>{isSuperAdmin ? 'All Quizzes' : 'Quiz Management'}</h3>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">+ Create Quiz</button>
              </div>
              {quizzesLoading ? <Loading text="Loading quizzes..." /> : (
                <div className="quizzes-list">
                  {quizzes.map(quiz => {
                    const isExpired = quiz.expiresAt && new Date(quiz.expiresAt) < new Date();
                    const isAvailable = quiz.isActive && !isExpired;
                    return (
                      <div key={quiz._id} className="quiz-management-item">
                        <div className="quiz-info">
                          <h4>{quiz.title}</h4>
                          {isSuperAdmin && <small style={{color: '#6366f1'}}>By: {quiz.createdBy?.username || 'Unknown'}</small>}
                          <p>{quiz.description}</p>
                          <div className="quiz-meta">
                            <span className="category">{quiz.category}</span>
                            <span className={`difficulty ${quiz.difficulty}`}>{quiz.difficulty}</span>
                            <span>{quiz.questions?.length || 0} questions</span>
                            <span>{quiz.stats?.timesTaken || 0} attempts</span>
                            <span className={`status ${isAvailable ? 'active' : 'inactive'}`}>
                              {isAvailable ? 'Active' : (isExpired ? 'Expired' : 'Inactive')}
                            </span>
                          </div>
                        </div>
                        <div className="quiz-actions">
                          <button onClick={() => startEditing(quiz)} className="btn btn-outline btn-sm">Edit</button>
                          <button onClick={() => handleDeleteQuiz(quiz._id)} className="btn btn-danger btn-sm">Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && <UsersManagement isSuperAdmin={isSuperAdmin} />}
          {activeTab === 'results' && (
            <div className="results-management">
              <div className="management-header">
                <h3>{isSuperAdmin ? 'All Results' : 'Quiz Results'}</h3>
                <span>Total: {recentResults.length} attempts</span>
              </div>
              {resultsLoading ? <Loading text="Loading results..." /> : recentResults.length > 0 ? (
                <div className="results-list">
                  <div className="results-header">
                    <span>User</span>
                    <span>Quiz</span>
                    {isSuperAdmin && <span>Created By</span>}
                    <span>Score</span>
                    <span>Time</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {recentResults.map(result => (
                    <div key={result._id} className="result-item">
                      <div className="result-user"><strong>{result.userName}</strong></div>
                      <div className="result-quiz">{result.quizId?.title || 'Unknown Quiz'}</div>
                      {isSuperAdmin && <div className="result-creator">{result.quizId?.createdBy?.username || 'N/A'}</div>}
                      <div className="result-score">
                        <span className={`score-badge ${result.passed ? 'passed' : 'failed'}`}>{Math.round(result.percentage || 0)}%</span>
                      </div>
                      <div className="result-time">{result.timeTaken}s</div>
                      <div className="result-date">{new Date(result.completedAt || result.createdAt).toLocaleDateString()}</div>
                      <div className="result-status">
                        <span className={`status ${result.passed ? 'passed' : 'failed'}`}>{result.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><p>No quiz results yet.</p></div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Quiz" size="large">
        <QuizForm onSubmit={handleCreateQuiz} loading={false} />
      </Modal>
      <Modal isOpen={!!editingQuiz} onClose={() => setEditingQuiz(null)} title="Edit Quiz" size="large">
        {editingQuiz && <QuizForm quiz={editingQuiz} onSubmit={handleUpdateQuiz} loading={false} />}
      </Modal>
    </div>
  );
};

export default Admin;
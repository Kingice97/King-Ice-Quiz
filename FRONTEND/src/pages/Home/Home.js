import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import { userService } from '../../services/userService';
import QuizCard from '../../components/quiz/QuizCard/QuizCard';
import Loading from '../../components/common/Loading/Loading';
import { FaBrain, FaRocket, FaChartBar, FaTrophy, FaComments, FaBook, FaBolt, FaUsers, FaChartLine, FaEdit, FaCog, FaKey } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();
const { data: quizzesData, loading: quizzesLoading } = useApi(() => {
  if (isAdmin) {
    return quizService.getAdminQuizzes({ limit: 100 });
  }
  return quizService.getQuizzes({ limit: 6 });
}, null, [isAdmin, isAuthenticated]);
  const { data: usersData, loading: usersLoading } = useApi(() =>
    userService.getUsers({ limit: 100 })
  );
  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    quizService.getRecentResults({ limit: 100 })
  );

  // REMOVED: leaderboard data fetching
  const featuredQuizzes = quizzesData?.data || [];
  const users = usersData?.data || [];
  const results = resultsData?.data || [];

  const activeQuizzes = featuredQuizzes.length;
  const regularUsers = users.filter(user => user.role === 'user');
  const totalUsers = regularUsers.length;
  const totalAttempts = results.length;
  
  const activeUsers = regularUsers.filter(user => 
    user.isActive === true || 
    (user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  ).length;

  // ADMIN VIEW
  if (isAdmin) {
    return (
      <div className="home">
        <section className="hero admin-hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Welcome to Admin Dashboard</h1>
              <p>
                Manage your quiz platform, track user activity, and create engaging content 
                for your community. Generate access codes for private quizzes and share with your students.
              </p>
              <div className="hero-actions">
                <Link to="/admin" className="btn btn-primary btn-lg">
                  Go to Admin Dashboard
                </Link>
                <Link to="/admin/quizzes" className="btn btn-outline btn-lg">
                  Manage Quizzes
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic admin-graphic">
                <FaCog className="graphic-icon" />
              </div>
            </div>
          </div>
        </section>

        <section className="admin-stats">
          <div className="container">
            <h2>Platform Overview</h2>
            {(quizzesLoading || usersLoading || resultsLoading) ? (
              <Loading text="Loading platform stats..." />
            ) : (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon"><FaChartBar /></div>
                  <div className="stat-info">
                    <span className="stat-value">{activeQuizzes}</span>
                    <span className="stat-label">Active Quizzes</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><FaUsers /></div>
                  <div className="stat-info">
                    <span className="stat-value">{totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                    <small style={{fontSize: '10px', color: '#6c757d', marginTop: '4px'}}>
                      (Regular users only)
                    </small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><FaChartLine /></div>
                  <div className="stat-info">
                    <span className="stat-value">{activeUsers}</span>
                    <span className="stat-label">Active Users</span>
                    <small style={{fontSize: '10px', color: '#6c757d', marginTop: '4px'}}>
                      (Regular users only)
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="admin-actions">
          <div className="container">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/admin/quizzes" className="action-card">
                <div className="action-icon"><FaEdit /></div>
                <div className="action-content">
                  <h3>Manage Quizzes</h3>
                  <p>Create, edit, and generate access codes for your quizzes</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
              <Link to="/admin/users" className="action-card">
                <div className="action-icon"><FaUsers /></div>
                <div className="action-content">
                  <h3>User Management</h3>
                  <p>View and manage all registered users and their activity</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
              <Link to="/admin/results" className="action-card">
                <div className="action-icon"><FaChartLine /></div>
                <div className="action-content">
                  <h3>View Results</h3>
                  <p>Analyze quiz attempts and track performance by access code</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
              <Link to="/admin" className="action-card">
                <div className="action-icon"><FaCog /></div>
                <div className="action-content">
                  <h3>Admin Dashboard</h3>
                  <p>Platform management and user analytics</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // LOGGED-IN USER VIEW
  if (isAuthenticated) {
    return (
      <div className="home">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Welcome back, {user?.username}! 👋</h1>
              <p>
                Ready to test your knowledge? Join a quiz with a code from your teacher, 
                or browse available public quizzes below.</p>
              <div className="hero-actions">
                <Link to="/join" className="btn btn-primary btn-lg">
                  <FaKey /> Join Quiz with Code
                </Link>
                <Link to="/quizzes" className="btn btn-outline btn-lg">
                  Browse Quizzes
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-graphic">
                <FaBrain className="graphic-icon" />
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <h2>Your Quiz Journey</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"><FaKey /></div>
                <h3>Join with Code</h3>
                <p>Enter the access code provided by your teacher to take assigned quizzes.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaRocket /></div>
                <h3>Continue Learning</h3>
                <p>Pick up where you left off and discover new quizzes tailored to your interests.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaChartBar /></div>
                <h3>Track Progress</h3>
                <p>Monitor your improvement with detailed analytics and personal performance stats.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaComments /></div>
                <h3>Join Conversations</h3>
                <p>Chat with fellow quiz enthusiasts and share knowledge in real-time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Available Public Quizzes */}
        <section className="featured-quizzes">
          <div className="container">
            <div className="section-header">
              <h2>Available Public Quizzes</h2>
              <Link to="/quizzes" className="btn btn-outline">
                View All
              </Link>
            </div>
            
            {quizzesLoading ? (
              <Loading text="Loading quizzes..." />
            ) : featuredQuizzes.length > 0 ? (
              <div className="quizzes-grid">
                {featuredQuizzes.map(quiz => (
                  <QuizCard key={quiz._id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No quizzes available yet. Check back soon or join with a code!</p>
                <Link to="/join" className="btn btn-primary">
                  <FaKey /> Join with Code
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // LANDING PAGE (not logged in)
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Learn, Compete, and Grow with King Ice Quiz</h1>
            <p>
              Join interactive quizzes created by teachers and educators. Enter a quiz code 
              to get started, or sign up to track your progress.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Sign In
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-graphic">
              <FaBrain className="graphic-icon" />
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose King Ice Quiz?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><FaKey /></div>
              <h3>Private Quizzes</h3>
              <p>Access quizzes with unique codes from your teachers. Only you and your classmates see them.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaBolt /></div>
              <h3>Instant Feedback</h3>
              <p>Get immediate results with detailed explanations and performance analytics.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaBook /></div>
              <h3>Diverse Categories</h3>
              <p>From science to entertainment, quizzes for every interest and knowledge level.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FaComments /></div>
              <h3>Real-time Chat</h3>
              <p>Discuss questions and share knowledge with other learners in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Quiz Journey?</h2>
            <p>Join learners using King Ice Quiz. Have a code from your teacher? You can join instantly!</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account
              </Link>
              <Link to="/join" className="btn btn-outline btn-lg">
                <FaKey /> Join with Code
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
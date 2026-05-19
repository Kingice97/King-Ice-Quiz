import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import { userService } from '../../services/userService';
import QuizCard from '../../components/quiz/QuizCard/QuizCard';
import Loading from '../../components/common/Loading/Loading';
import { FaBrain, FaRocket, FaChartBar, FaTrophy, FaComments, FaBook, FaBolt, FaUsers, FaChartLine, FaEdit, FaCog } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { data: quizzesData, loading: quizzesLoading } = useApi(() => 
    quizService.getQuizzes({ limit: 6 })
  );
  const { data: leaderboardData, loading: leaderboardLoading } = useApi(() =>
    userService.getLeaderboard({ limit: 5 })
  );
  const { data: usersData, loading: usersLoading } = useApi(() =>
    userService.getUsers({ limit: 100 })
  );
  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    quizService.getRecentResults({ limit: 100 })
  );

  const featuredQuizzes = quizzesData?.data || [];
  const leaderboard = leaderboardData?.data || [];
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

  if (isAdmin) {
    return (
      <div className="home">
        <section className="hero admin-hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Welcome to Admin Dashboard</h1>
              <p>
                Manage your quiz platform, track user activity, and create engaging content 
                for your community. Access comprehensive analytics and platform controls.
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
                  <p>Create, edit, and organize all quizzes in the system</p>
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
                  <p>Analyze quiz attempts and user performance data</p>
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

        {featuredQuizzes.length > 0 && (
          <section className="recent-activity">
            <div className="container">
              <div className="section-header">
                <h2>Recent Quizzes</h2>
                <Link to="/admin/quizzes" className="btn btn-outline">
                  Manage All Quizzes
                </Link>
              </div>
              
              {quizzesLoading ? (
                <Loading text="Loading quizzes..." />
              ) : (
                <div className="quizzes-grid">
                  {featuredQuizzes.slice(0, 3).map(quiz => (
                    <QuizCard key={quiz._id} quiz={quiz} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Test Your Knowledge with King Ice Quiz</h1>
            <p>
              Challenge yourself with thousands of quizzes across various categories. 
              Compete with others, track your progress, and become a quiz lord!
              <strong> Now with real-time chat!</strong>
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/quizzes" className="btn btn-primary btn-lg">
                  Browse Quizzes
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-graphic">
              <FaBrain className="graphic-icon" />
            </div>
          </div>
        </div>
      </section>

      {isAuthenticated ? (
        <section className="features">
          <div className="container">
            <h2>Your Quiz Journey</h2>
            <div className="features-grid">
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
                <div className="feature-icon"><FaTrophy /></div>
                <h3>Climb Rankings</h3>
                <p>Compete with others and watch your position rise on the global leaderboard.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaComments /></div>
                <h3>Join Conversations</h3>
                <p>Chat with fellow quiz enthusiasts and share knowledge in real-time.</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="features">
          <div className="container">
            <h2>Why Choose King Ice Quiz?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"><FaBook /></div>
                <h3>Diverse Categories</h3>
                <p>From science to entertainment, we have quizzes for every interest and knowledge level.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaBolt /></div>
                <h3>Instant Feedback</h3>
                <p>Get immediate results with detailed explanations and performance analytics.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaTrophy /></div>
                <h3>Compete & Learn</h3>
                <p>Climb the leaderboards, earn achievements, and track your learning progress.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><FaComments /></div>
                <h3>Real-time Chat</h3>
                <p>Chat with other quiz enthusiasts, discuss questions, and share knowledge in real-time.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="featured-quizzes">
        <div className="container">
          <div className="section-header">
            <h2>Featured Quizzes</h2>
            <Link to="/quizzes" className="btn btn-outline">
              View All Quizzes
            </Link>
          </div>
          
          {quizzesLoading ? (
            <Loading text="Loading quizzes..." />
          ) : (
            <div className="quizzes-grid">
              {featuredQuizzes.map(quiz => (
                <QuizCard key={quiz._id} quiz={quiz} />
              ))}
            </div>
          )}
        </div>
      </section>

      {leaderboard.length > 0 && (
        <section className="leaderboard">
          <div className="container">
            <h2>Top Performers</h2>
            {leaderboardLoading ? (
              <Loading text="Loading leaderboard..." />
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((item, index) => (
                  <div key={item._id} className="leaderboard-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="user-info">
                      <span className="username">{item.user?.username}</span>
                      <span className="stats">
                        {Math.round(item.averageScore)}% avg • {item.quizzesTaken} quizzes
                      </span>
                    </div>
                    <div className="score">{Math.round(item.averageScore)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Your Quiz Journey?</h2>
              <p>Join thousands of learners testing their knowledge every day. <strong>Chat with the community in real-time!</strong></p>
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Free Account
                </Link>
                <Link to="/quizzes" className="btn btn-outline btn-lg">
                  Browse as Guest
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
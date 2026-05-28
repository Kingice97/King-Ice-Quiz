import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../../components/auth/LoginForm/LoginForm';
import { FaChartBar, FaTrophy, FaBullseye, FaSave, FaComments, FaKey } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (formData) => {
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  return (
    <div className="login-page">
      <Helmet>
        <title>Login - King Ice Quiz</title>
        <meta name="description" content="Sign in to your King Ice Quiz account" />
      </Helmet>

      <div className="login-container">
        <div className="login-content">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue your quiz journey</p>
          </div>

          <LoginForm 
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />

          <div className="login-features">
            <h3>What you'll get:</h3>
            <ul>
              <li><FaKey /> Join private quizzes with access codes</li>
              <li><FaChartBar /> Track your progress and statistics</li>
              <li><FaTrophy /> Compete on leaderboards</li>
              <li><FaBullseye /> Personalized quiz recommendations</li>
              <li><FaComments /> Chat with other quiz enthusiasts</li>
            </ul>
            <p className="login-code-hint">
              Have a quiz code? <Link to="/join">Join Quiz here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
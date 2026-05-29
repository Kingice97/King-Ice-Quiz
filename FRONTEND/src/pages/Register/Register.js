import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RegisterForm from '../../components/auth/RegisterForm/RegisterForm';
import { FaBullseye, FaChartLine, FaTrophy, FaComments, FaKey } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (formData) => {
    try {
      await register(formData);
      navigate('/');
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  return (
    <div className="register-page">
      <Helmet>
        <title>Sign Up - King Ice Quiz</title>
        <meta name="description" content="Create your King Ice Quiz account and start testing your knowledge with interactive quizzes" />
      </Helmet>

      <div className="register-container">
        <div className="register-content">
          <div className="register-header">
            <h1>Join King Ice Quiz</h1>
            <p>Start your knowledge journey today</p>
          </div>

          <RegisterForm 
            onSubmit={handleRegister}
            loading={loading}
            error={error}
          />

          <div className="register-benefits">
            <h3>With King Ice Quiz you can:</h3>
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon"><FaKey /></div>
                <h4>Join with Code</h4>
                <p>Enter access codes from teachers to take private quizzes</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><FaBullseye /></div>
                <h4>Take Quizzes</h4>
                <p>Test your knowledge across various categories</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><FaChartLine /></div>
                <h4>Track Progress</h4>
                <p>Monitor your improvement with detailed analytics</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><FaComments /></div>
                <h4>Real-time Chat</h4>
                <p>Connect with other learners and discuss quizzes</p>
              </div>
            </div>
            <p className="register-code-hint">
              Already have a quiz code? <Link to="/join">Join Quiz here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaKey, FaArrowRight, FaSearch } from 'react-icons/fa';
import './JoinQuiz.css';

const JoinQuiz = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter an access code');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'https://king-ice-quiz-app.onrender.com';
      
      const response = await fetch(`${API_URL}/api/quizzes/join-by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Navigate to the quiz
        navigate(`/quiz/${data.data._id}`, { state: { fromCode: true } });
      } else {
        setError(data.message || 'Invalid access code');
      }
    } catch (error) {
      setError('Failed to verify code. Please check your connection.');
      console.error('Join quiz error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-quiz-page">
      <div className="join-quiz-container">
        <div className="join-quiz-card">
          <div className="join-quiz-icon">
            <FaKey />
          </div>
          <h1>Join Quiz</h1>
          <p className="join-quiz-subtitle">
            Enter the access code provided by your teacher or quiz administrator
          </p>

          <form onSubmit={handleSubmit} className="join-quiz-form">
            <div className="code-input-group">
              <span className="code-input-icon">
                <FaSearch />
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter quiz code (e.g., QUIZ-ABC123)"
                className="code-input"
                maxLength={20}
                autoFocus
              />
            </div>

            {error && (
              <div className="code-error">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading || !code.trim()}
            >
              {loading ? (
                'Verifying...'
              ) : (
                <>
                  Join Quiz <FaArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="join-quiz-info">
            <p>
              <strong>How it works:</strong>
            </p>
            <ul>
              <li>Get the unique quiz code from your teacher</li>
              <li>Enter the code above to access the quiz</li>
              <li>Complete the quiz and see your results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinQuiz;
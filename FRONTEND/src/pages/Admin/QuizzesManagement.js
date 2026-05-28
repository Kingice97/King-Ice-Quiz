import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import Modal from '../../components/common/Modal/Modal';
import QuizForm from '../../components/admin/QuizForm/QuizForm';
import { FaKey, FaCopy, FaCheck } from 'react-icons/fa';
import './QuizzesManagement.css';

const QuizzesManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(null);

  const { data: quizzesData, loading: quizzesLoading, setData: setQuizzesData } = useApi(() =>
  quizService.getAdminQuizzes({ limit: 100 })
);

  const quizzes = quizzesData?.data || [];

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || quiz.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(quizzes.map(quiz => quiz.category))];

  // NEW: Generate access code for a quiz
  const handleGenerateCode = async (quizId) => {
    setGeneratingCode(quizId);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/quizzes/${quizId}/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the quiz in the list with the new code
        setQuizzesData(prev => ({
          ...prev,
          data: prev.data.map(quiz => 
            quiz._id === quizId ? { ...quiz, accessCode: data.data.accessCode, requiresCode: true } : quiz
          )
        }));
      } else {
        alert(data.message || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
      alert('Failed to generate code. Please try again.');
    } finally {
      setGeneratingCode(null);
    }
  };

  // NEW: Copy code to clipboard
  const handleCopyCode = (code, quizId) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(quizId);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  // NEW: Remove access code
  const handleRemoveCode = async (quizId) => {
    if (!window.confirm('Remove the access code? Users will no longer be able to join with the current code.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/quizzes/${quizId}/access-code`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setQuizzesData(prev => ({
          ...prev,
          data: prev.data.map(quiz => 
            quiz._id === quizId ? { ...quiz, accessCode: null, requiresCode: false } : quiz
          )
        }));
      }
    } catch (error) {
      console.error('Failed to remove code:', error);
      alert('Failed to remove code. Please try again.');
    }
  };

  const handleCreateQuiz = async (quizData) => {
    try {
      const response = await quizService.createQuiz(quizData);
      setQuizzesData(prev => ({
        ...prev,
        data: [response.data, ...prev.data]
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
        data: prev.data.map(quiz => 
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
          data: prev.data.filter(quiz => quiz._id !== quizId)
        }));
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        alert('Failed to delete quiz. Please try again.');
      }
    }
  };

  const toggleQuizStatus = async (quiz) => {
    try {
      const response = await quizService.updateQuiz(quiz._id, {
        ...quiz,
        isActive: !quiz.isActive
      });
      setQuizzesData(prev => ({
        ...prev,
        data: prev.data.map(q => q._id === quiz._id ? response.data : q)
      }));
    } catch (error) {
      console.error('Failed to update quiz status:', error);
      alert('Failed to update quiz status. Please try again.');
    }
  };

  return (
    <div className="quizzes-management-page">
      <Helmet>
        <title>Manage Quizzes - Admin Dashboard</title>
      </Helmet>

      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>Manage Quizzes</h1>
            <p>Create, edit, and manage all quizzes in the system</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Create New Quiz
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="filter-select">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-control"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="quizzes-list-section">
          {quizzesLoading ? (
            <Loading text="Loading quizzes..." />
          ) : (
            <>
              <div className="quizzes-stats">
                <span>Total: {quizzes.length} quizzes</span>
                <span>Active: {quizzes.filter(q => q.isActive).length} quizzes</span>
                <span>Showing: {filteredQuizzes.length} quizzes</span>
              </div>

              <div className="quizzes-grid">
                {filteredQuizzes.map(quiz => (
                  <div key={quiz._id} className="quiz-card">
                    <div className="quiz-header">
                      <h3>{quiz.title}</h3>
                      <div className="quiz-status-badge">
                        <span className={`status ${quiz.isActive ? 'active' : 'inactive'}`}>
                          {quiz.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="quiz-description">{quiz.description}</p>
                    
                    <div className="quiz-meta">
                      <span className="category">{quiz.category}</span>
                      <span className={`difficulty ${quiz.difficulty}`}>
                        {quiz.difficulty}
                      </span>
                      <span>{quiz.questions?.length || 0} questions</span>
                    </div>

                    {/* NEW: Access Code Section */}
                    <div className="quiz-access-code">
                      {quiz.accessCode ? (
                        <div className="code-display">
                          <span className="code-label"><FaKey /> Access Code:</span>
                          <div className="code-value-row">
                            <code className="code-text">{quiz.accessCode}</code>
                            <button
                              className="btn-copy"
                              onClick={() => handleCopyCode(quiz.accessCode, quiz._id)}
                              title="Copy code"
                            >
                              {copiedCode === quiz._id ? <FaCheck /> : <FaCopy />}
                            </button>
                          </div>
                          <button
                            className="btn-remove-code"
                            onClick={() => handleRemoveCode(quiz._id)}
                          >
                            Remove Code
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-generate-code"
                          onClick={() => handleGenerateCode(quiz._id)}
                          disabled={generatingCode === quiz._id}
                        >
                          <FaKey />
                          {generatingCode === quiz._id ? 'Generating...' : 'Generate Access Code'}
                        </button>
                      )}
                    </div>

                    <div className="quiz-stats">
                      <span>{quiz.stats?.timesTaken || 0} attempts</span>
                      <span>{Math.round(quiz.stats?.averageScore || 0)}% avg</span>
                    </div>

                    <div className="quiz-actions">
                      <button
                        onClick={() => setEditingQuiz(quiz)}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleQuizStatus(quiz)}
                        className={`btn btn-sm ${quiz.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {quiz.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredQuizzes.length === 0 && (
                <div className="empty-state">
                  <p>No quizzes found matching your criteria.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    Create Your First Quiz
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Quiz Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Quiz"
        size="large"
      >
        <QuizForm
          onSubmit={handleCreateQuiz}
          loading={false}
        />
      </Modal>

      {/* Edit Quiz Modal */}
      <Modal
        isOpen={!!editingQuiz}
        onClose={() => setEditingQuiz(null)}
        title="Edit Quiz"
        size="large"
      >
        {editingQuiz && (
          <QuizForm
            quiz={editingQuiz}
            onSubmit={handleUpdateQuiz}
            loading={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default QuizzesManagement;
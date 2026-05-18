const Question = require('../models/Question');

// @desc    Get all questions for admin
// @route   GET /api/questions
// @access  Private/Admin
exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions'
    });
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private/Admin
exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question'
    });
  }
};

// @desc    Create new question
// @route   POST /api/questions
// @access  Private/Admin
exports.createQuestion = async (req, res) => {
  try {
    const questionData = {
      ...req.body,
      createdBy: req.user.id
    };

    const question = await Question.create(questionData);

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating question'
    });
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res) => {
  try {
    let question = await Question.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating question'
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question'
    });
  }
};
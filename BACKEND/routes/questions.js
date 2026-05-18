const express = require('express');
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestion
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getQuestions);
router.get('/:id', getQuestion);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
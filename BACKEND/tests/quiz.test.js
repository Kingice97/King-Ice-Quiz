const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

describe('Quiz Controller', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create a test user and get auth token
    const user = await User.create({
      username: 'quiztestuser',
      email: 'quiztest@example.com',
      password: 'password123',
      role: 'admin'
    });

    userId = user._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'quiztest@example.com',
        password: 'password123'
      });

    authToken = loginRes.body.token;
  });

  describe('GET /api/quizzes', () => {
    it('should get all quizzes', async () => {
      await Quiz.create({
        title: 'Test Quiz',
        description: 'Test Description',
        category: 'Test Category',
        difficulty: 'Easy',
        questions: [
          {
            questionText: 'Test Question?',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            correctAnswer: 0
          }
        ],
        createdBy: userId
      });

      const res = await request(app)
        .get('/api/quizzes')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/quizzes', () => {
    it('should create a new quiz', async () => {
      const quizData = {
        title: 'New Test Quiz',
        description: 'New Test Description',
        category: 'Test Category',
        difficulty: 'Medium',
        timeLimit: 15,
        questions: [
          {
            questionText: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            points: 2
          }
        ]
      };

      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quizData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(quizData.title);
    });
  });
});
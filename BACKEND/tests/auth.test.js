const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe(userData.username);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.token).toBeDefined();
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await User.create(userData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(credentials.email);
      expect(res.body.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
# King Ice Quiz - Backend API

A robust, secure RESTful API for the King Ice Quiz application built with Node.js, Express, and MongoDB. Features comprehensive quiz management, user authentication, real-time chat, and analytics.

## 🚀 Live API
**Base URL:** `https://king-ice-quiz-app.onrender.com`

## 📋 Features

### 🔐 Authentication & Security
- JWT-based authentication
- Password encryption with bcrypt
- Role-based access control (User/Admin)
- Rate limiting (100 requests/15min per IP)
- Input sanitization & validation
- SQL/NoSQL injection protection
- Security headers (CSP, XSS, HSTS)

### 🎯 Quiz Management
- Full CRUD operations for quizzes
- Multiple categories & difficulty levels
- Quiz expiration & auto-close
- Max attempts enforcement
- Question randomization (optional)
- Time-limited quizzes
- Passing score requirements

### 💬 Real-time Chat System
- WebSocket-based real-time messaging
- Multiple chat rooms by quiz categories
- Direct messaging between users
- Message history & persistence
- Online user presence
- Chat moderation endpoints

### 📊 Analytics & Results
- Comprehensive result tracking
- Leaderboard generation
- User statistics & progress
- Quiz performance analytics
- Ranking system with badges

### 👤 User Management
- User profiles with bio & avatar
- Profile picture upload (Cloudinary)
- Activity tracking
- Achievement system
- User search & discovery

### 🛠️ Admin Features
- Complete user management
- Content moderation dashboard
- System analytics
- Bulk operations
- Chat moderation tools
- Database management utilities

## 🏗️ Tech Stack

### Core
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose

### Security
- **Authentication:** JWT, bcrypt
- **Rate Limiting:** express-rate-limit
- **Security:** Helmet, CORS, xss-clean
- **Validation:** express-validator

### Real-time
- **WebSocket:** Socket.io
- **File Upload:** Multer, Cloudinary

## 📁 Project Structure

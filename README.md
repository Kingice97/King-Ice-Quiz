<div align="center">
  <img src="FRONTEND/public/brain-icon.png" alt="King Ice Quiz Logo" width="120" />
  
  # 🧊 King Ice Quiz
  
  **Full-Stack Quiz & Social Learning Platform**
  
  A production-grade web application combining interactive quizzes with social learning. Features real-time chat, leaderboards, user profiles, and comprehensive admin dashboard. Live for 6+ months.
  
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
  [![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socketdotio)](https://socket.io/)
  [![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens)](https://jwt.io/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

  <br />
  
  <p align="center">
    <a href="#-live-demo"><strong>View Live Demo</strong></a> ·
    <a href="#-features"><strong>Features</strong></a> ·
    <a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
    <a href="#-project-structure"><strong>Project Structure</strong></a> ·
    <a href="#-getting-started"><strong>Getting Started</strong></a>
  </p>
</div>

---

## 🚀 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend (Vercel)** | [king-ice-quiz.vercel.app](https://king-ice-quiz.vercel.app) | ![Vercel](https://img.shields.io/badge/vercel-deployed-000000?logo=vercel) |
| **Backend API (Render)** | [king-ice-quiz-app.onrender.com](https://king-ice-quiz-app.onrender.com) | ![Render](https://img.shields.io/badge/render-deployed-46E3B7?logo=render) |

---

## ✨ Features

### 🎯 Quiz System
- **Multiple Categories**: Various quiz topics with Easy/Medium/Hard difficulty levels
- **Timed Quizzes**: Countdown timers with automatic submission
- **Randomized Questions**: Optional question shuffling for varied attempts
- **Smart Scoring**: Passing score requirements with max attempts enforcement
- **Real-time Progress**: Live progress tracking during quiz taking
- **Question Management**: Full CRUD operations for quiz questions

### 💬 Real-Time Chat
- **WebSocket Communication**: Instant messaging powered by Socket.io
- **Category Rooms**: Dedicated chat rooms for each quiz category
- **Direct Messaging**: Private conversations between users
- **Online Presence**: Real-time user online/offline indicators
- **Message History**: Persistent chat history with MongoDB storage
- **Chat Moderation**: Report system and admin moderation tools

### 📊 Results & Analytics
- **Detailed Breakdown**: Answer-by-answer review with correct answers
- **Performance Charts**: Visual analytics with Chart.js integration
- **Leaderboards**: Global and category-specific rankings
- **Achievement System**: Badges and trophies for milestones
- **Quiz History**: Complete record of past quiz attempts
- **Progress Tracking**: Track improvement over time

### 👤 User Profiles
- **Customizable Profiles**: Bio, avatar, and social links
- **Photo Upload**: Profile picture upload via Cloudinary
- **Activity Feed**: Recent quiz attempts and achievements
- **Achievement Showcase**: Display earned badges and trophies
- **User Search**: Find and connect with other learners

### 🛠️ Admin Dashboard
- **Quiz Management**: Create, edit, and delete quizzes
- **User Management**: View and manage user accounts
- **Content Moderation**: Monitor and moderate chat content
- **Analytics Overview**: System-wide statistics and reports
- **Bulk Operations**: Efficient management of multiple items

### 🔒 Security
- **JWT Authentication**: Access and refresh token rotation
- **bcrypt Hashing**: Secure password storage
- **Rate Limiting**: API protection (100 requests per 15 minutes)
- **Input Sanitization**: XSS and NoSQL injection prevention
- **Helmet.js**: Security headers (CSP, HSTS, XSS protection)
- **AES Encryption**: Client-side encryption for sensitive data
- **Role-Based Access**: User and Admin permission levels

### 📱 User Experience
- **Fully Responsive**: Works on mobile, tablet, and desktop
- **Dark/Light Theme**: Toggle with persistent preference
- **PWA Support**: Installable on mobile devices
- **Keyboard Accessible**: Accessibility-focused design

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) | UI Framework |
| ![React Router](https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter) | Client-side Routing |
| ![Socket.io Client](https://img.shields.io/badge/Socket.io-Client-010101?logo=socketdotio) | Real-time Communication |
| ![Chart.js](https://img.shields.io/badge/Chart.js-Analytics-FF6384?logo=chartdotjs) | Data Visualization |
| ![Axios](https://img.shields.io/badge/Axios-HTTP_Client-5A29E4?logo=axios) | HTTP Client |
| ![CSS3](https://img.shields.io/badge/CSS3-Styling-1572B6?logo=css3) | Styling |
| ![crypto-js](https://img.shields.io/badge/crypto--js-Encryption-666) | Client-side Encryption |
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-Images-3448C5) | Image Upload |

### Backend
| Technology | Purpose |
|------------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=nodedotjs) | Runtime |
| ![Express](https://img.shields.io/badge/Express-4-000000?logo=express) | Web Framework |
| ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb) | Cloud Database |
| ![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?logo=mongoose) | ODM |
| ![Socket.io](https://img.shields.io/badge/Socket.io-Server-010101?logo=socketdotio) | WebSocket Server |
| ![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens) | Authentication |
| ![bcrypt](https://img.shields.io/badge/bcrypt-Hashing-666) | Password Hashing |
| ![Multer](https://img.shields.io/badge/Multer-Uploads-666) | File Upload |

### DevOps & Services
| Service | Purpose |
|---------|---------|
| ![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel) | Frontend Hosting |
| ![Render](https://img.shields.io/badge/Render-Backend-46E3B7?logo=render) | Backend Hosting |
| ![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Database-47A248?logo=mongodb) | Cloud Database |
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-Images-3448C5) | Image Hosting |
| ![GitHub](https://img.shields.io/badge/GitHub-Repo-181717?logo=github) | Version Control |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18.0 or higher
- **MongoDB Atlas** account (free tier)
- **npm** v9 or higher

### Quick Start

```bash
git clone https://github.com/Kingice97/King-Ice-Quiz.git
cd King-Ice-Quiz

# Backend
cd BACKEND
npm install
npm start

# Frontend (new terminal)
cd FRONTEND
npm install
npm start 

```

Frontend: http://localhost:3000 | Backend: http://localhost:5000

---

## 📄 License

MIT License

---

<div align="center">
  <p>Built with ❄️ by King Ice</p>
</div>
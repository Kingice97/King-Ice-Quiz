import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { initSecurity } from './utils/security';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar/Navbar';
import Footer from './components/common/Footer/Footer';
import MobileBottomNav from './components/common/MobileBottomNav/MobileBottomNav';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import QuizList from './pages/QuizList/QuizList';
import Quiz from './pages/Quiz/Quiz';
import Result from './pages/Result/Result';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import Dashboard from './pages/Dashboard/Dashboard';
import QuizResults from './pages/QuizResults/QuizResults';
import NotFound from './pages/NotFound/NotFound';
import UserProfile from './pages/UserProfile/UserProfile';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import JoinQuiz from './pages/JoinQuiz/JoinQuiz';

// Chat Pages
import Chat from './pages/Chat/Chat';
import UserSearch from './pages/UserSearch/UserSearch';

// Admin Pages
import QuizzesManagement from './pages/Admin/QuizzesManagement';
import QuestionsManagement from './pages/Admin/QuestionsManagement';
import UsersManagement from './pages/Admin/UsersManagement';
import ResultsManagement from './pages/Admin/ResultsManagement';
import LeaderboardPage from './pages/Admin/LeaderboardPage';

import './App.css';

// Keep-alive service
const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔔 KeepAlive: Disabled in development');
    return;
  }

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  if (!backendUrl) {
    console.warn('❌ KeepAlive: No backend URL found');
    return;
  }

  console.log('🔔 KeepAlive: Starting service for backend:', backendUrl);

  fetch(`${backendUrl}/health`)
    .then(response => {
      if (response.ok) {
        console.log('✅ KeepAlive: Initial ping successful');
      } else {
        console.warn('⚠️ KeepAlive: Initial ping failed', response.status);
      }
    })
    .catch(error => {
      console.warn('⚠️ KeepAlive: Initial ping error', error.message);
    });

  const intervalId = setInterval(async () => {
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ KeepAlive: Backend ping successful');
      } else {
        console.warn('⚠️ KeepAlive: Backend ping failed', response.status);
      }
    } catch (error) {
      console.warn('⚠️ KeepAlive: Backend ping error', error.message);
    }
  }, 10 * 60 * 1000);

  return () => {
    clearInterval(intervalId);
    console.log('🔔 KeepAlive: Service stopped');
  };
};

// Layout wrapper component
const Layout = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  return (
    <div className="App">
      {!isChatPage && <Navbar />}
      <main className={`main-content ${isChatPage ? 'full-screen-chat' : ''}`}>
        {children}
      </main>
      {!isChatPage && <Footer />}
      {!isChatPage && <MobileBottomNav />}
    </div>
  );
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installDismissed, setInstallDismissed] = useState(
    localStorage.getItem('pwa_install_dismissed') === 'true'
  );

  useEffect(() => {
    initSecurity();

    const keepAliveCleanup = startKeepAlive();

    // ========== PWA INSTALLATION HANDLING ==========
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (!installDismissed && !localStorage.getItem('pwa_install_dismissed')) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
      
      console.log('📱 PWA: Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('🎉 PWA: App was successfully installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa_install_dismissed');
    };

    // ========== OFFLINE DETECTION ==========
    const handleOnline = () => {
      console.log('🌐 App: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📴 App: Offline');
      setIsOnline(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (keepAliveCleanup) {
        keepAliveCleanup();
      }
    };
  }, [installDismissed]);

  // ========== INSTALL PROMPT HANDLER ==========
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('❌ No install prompt available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`📱 User response to install prompt: ${outcome}`);
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        localStorage.removeItem('pwa_install_dismissed');
      } else {
        console.log('❌ User dismissed the install prompt');
        localStorage.setItem('pwa_install_dismissed', 'true');
        setInstallDismissed(true);
      }
    } catch (error) {
      console.error('❌ Error showing install prompt:', error);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
    setInstallDismissed(true);
  };

  const InstallPrompt = () => (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 10000,
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      animation: 'slideInUp 0.5s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '15px'
      }}>
        <div style={{
          fontSize: '28px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          📱
        </div>
        <div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Install King Ice Quiz
          </h4>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            Get the full app experience with offline quizzes!
          </p>
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={handleInstallClick}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Install App
        </button>
        <button 
          onClick={handleDismissInstall}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          Not Now
        </button>
      </div>
    </div>
  );

  const OfflineIndicator = () => (
    <div className="offline-indicator">
      <span>📶 You are currently offline</span>
    </div>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        <QuizProvider>
          <SocketProvider>
            <Router>
              {!isOnline && <OfflineIndicator />}
              {showInstallPrompt && <InstallPrompt />}
              
              <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/register" element={<Layout><Register /></Layout>} />
                <Route path="/quizzes" element={<Layout><QuizList /></Layout>} />
                <Route path="/join" element={<Layout><JoinQuiz /></Layout>} />
                
                <Route 
                  path="/quiz/:id" 
                  element={
                    <ProtectedRoute>
                      <Layout><Quiz /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/result" 
                  element={
                    <ProtectedRoute>
                      <Layout><Result /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute>
                      <Layout><UserSearch /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile/:username" 
                  element={
                    <ProtectedRoute>
                      <Layout><UserProfile /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><Admin /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/quizzes" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><QuizzesManagement /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/questions" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><QuestionsManagement /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><UsersManagement /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/results" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><ResultsManagement /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/leaderboard" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><LeaderboardPage /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/quiz/:id/results" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout><QuizResults /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
            </Router>
          </SocketProvider>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import InteractiveBubbles from './components/InteractiveBubbles';
import PWAManager from './components/PWAManager';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import AdminScreen from './components/AdminScreen';
import HomeScreen from './components/HomeScreen';
import BookingScreen from './components/BookingScreen';
import TrackingScreen from './components/TrackingScreen';
import './App.css';

// Composant AppContent qui sera à l'intérieur du Router
function AppContent() {
  const navigate = useNavigate();

  const handleNavigate = (from: string, to: string) => {
    // Navigation React Router
    navigate(to);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleBackFromAdmin = () => {
    navigate('/');
  };

  return (
    <div className="App relative min-h-screen transition-colors duration-1000">
      {/* Bulles interactives globales */}
      <InteractiveBubbles 
        intensity="medium" 
        followMouse={true} 
        clickEffect={true} 
      />
      
      {/* Gestionnaire PWA */}
      <PWAManager />
      
      <Routes>
        {/* Page d'accueil institutionnelle */}
        <Route path="/" element={<LandingPage onLoginClick={handleLogin} />} />
        
        {/* Pages d'authentification */}
        <Route path="/login" element={
          <LoginScreen onBack={handleBackToLanding} />
        } />
        <Route path="/register" element={
          <RegisterScreen onBack={handleLogin} onLogin={handleLogin} />
        } />
        
        {/* Page d'administration - Protégée pour admin uniquement */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminScreen onBack={handleBackFromAdmin} />
          </ProtectedRoute>
        } />
        
        {/* Pages de l'application - Protégées pour utilisateurs authentifiés */}
        <Route path="/home" element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        } />
        <Route path="/booking/:serviceType" element={
          <ProtectedRoute requiredRole="client">
            <BookingScreen />
          </ProtectedRoute>
        } />
        <Route path="/tracking" element={
          <ProtectedRoute>
            <TrackingScreen />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

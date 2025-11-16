// Composant pour protéger les routes selon l'authentification et le rôle
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'agent' | 'admin';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallbackPath = '/login' 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Affichage du loading pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-carcare-cyan-500"></div>
      </div>
    );
  }

  // Redirection si non authentifié
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Vérification du rôle si requis
  if (requiredRole && user.role !== requiredRole) {
    // Redirection vers la page d'accueil pour les rôles non autorisés
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

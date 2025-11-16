// Context pour la gestion de l'authentification
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types pour l'authentification
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'agent';
  phone?: string;
  profile?: any;
  profileImage?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Service pour les appels API
class AuthService {
  private static readonly API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  private static readonly TOKEN_KEY = 'carcare_token';
  public static readonly USER_KEY = 'carcare_user';

  static async login(email: string, password: string, fcmToken?: string): Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fcmToken }),
      });

      const data = await response.json();

      if (data.success) {
        // Stockage sécurisé du token et des données utilisateur
        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, message: data.message || 'Erreur de connexion' };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        return data.user;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }
}

// Provider d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si l'utilisateur est déjà connecté
        if (AuthService.isAuthenticated()) {
          const storedUser = AuthService.getStoredUser();
          const currentUser = await AuthService.getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
          } else if (storedUser) {
            // Utiliser les données stockées si l'API n'est pas disponible
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erreur login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(AuthService.USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser l'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export du service pour utilisation directe si nécessaire
export { AuthService };

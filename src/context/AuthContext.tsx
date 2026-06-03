import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../services/api';

interface User {
  id: string;
  fullName: string;
  username: string;
  role: string;
  department: string;
  securityClassification?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      handleClearAuth();
      setLoading(false);
      return;
    }

    try {
      const profile = await apiFetch('/auth/profile');
      if (profile && profile.userId) {
        const userObj: User = {
          id: profile.userId,
          fullName: profile.fullName,
          username: profile.username,
          role: profile.role,
          department: profile.department,
          securityClassification: profile.securityClassification,
        };
        localStorage.setItem('user', JSON.stringify(userObj));
        setToken(storedToken);
        setUser(userObj);
        setIsAuthenticated(true);
      } else {
        handleClearAuth();
      }
    } catch (e) {
      console.error('Session verification failed, logging out:', e);
      handleClearAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleClearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuth();

    const handleAuthLogoutEvent = () => {
      handleClearAuth();
    };

    window.addEventListener('auth-logout', handleAuthLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogoutEvent);
    };
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
    } catch (e) {
      handleClearAuth();
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    handleClearAuth();
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, checkAuth, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

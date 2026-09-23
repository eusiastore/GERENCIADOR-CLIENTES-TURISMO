import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Usuario } from '../types';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (token: string, user: Usuario) => void;
  logout: () => void;
  updateCurrentUser: (user: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStoragedAuth() {
      const storagedToken = localStorage.getItem('@trevotour:token');
      const storagedUser = localStorage.getItem('@trevotour:user');

      if (storagedToken && storagedUser) {
        try {
          setToken(storagedToken);
          setUser(JSON.parse(storagedUser));
          
          // Revalida com o backend
          const response = await api.get('/auth/me');
          if (response.data?.success && response.data?.data) {
            setUser(response.data.data);
            localStorage.setItem('@trevotour:user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          console.error('Erro ao verificar sessão:', error);
          logout();
        }
      }
      setLoading(false);
    }

    loadStoragedAuth();
  }, []);

  const login = (newToken: string, newUser: Usuario) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('@trevotour:token', newToken);
    localStorage.setItem('@trevotour:user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('@trevotour:token');
    localStorage.removeItem('@trevotour:user');
  };

  const updateCurrentUser = (updatedFields: Partial<Usuario>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('@trevotour:user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedAdmin = localStorage.getItem('admin');
    
    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, admin: adminData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
    
    return adminData;
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    const { access_token, admin: adminData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
    
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  const isAuthenticated = () => {
    return !!admin && !!localStorage.getItem('token');
  };

  const value = {
    admin,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

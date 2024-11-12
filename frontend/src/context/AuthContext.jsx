import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = () => {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const isAuth = !!accessToken;
    setIsAuthenticated(isAuth);
    
    if (isAuth && ['/login', '/signup', '/'].includes(location.pathname)) {
      navigate('/home', { replace: true });
    }
  };

  // Check on mount and location change
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  // Check periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
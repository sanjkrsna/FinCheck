import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        replace: true,
        state: { from: location.pathname }
      });
    }
  }, [isAuthenticated, navigate, location]);

  return isAuthenticated ? children : null;
};

export default ProtectedRoute; 
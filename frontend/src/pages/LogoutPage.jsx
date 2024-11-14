import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const logout = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

        if (accessToken && refreshToken) {
          const config = {
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          };
          await axios.post("http://127.0.0.1:8000/api/logout/", { "refresh": refreshToken }, config);
        }
      } catch (error) {
        console.error("Failed to logout", error.response?.data || error.message);
      } finally {
        // Clear all authentication tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        
        // Clear ALL market-related caches
        const cacheKeys = [
          'marketData',
          'newsData',
          'worldMarketsData',
          'watchlistData',
          'userWatchlist',
          'historicalMarketData',
          'worldMarketsData',
          'watchlistData'
        ];
        
        cacheKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // Update auth state
        setIsAuthenticated(false);

        // Show success message
        toast.success('Successfully logged out!', {
          position: "top-center",
          autoClose: 2000,
        });

        // Start fade-out after a short delay
        const timer = setTimeout(() => {
          setFadeOut(true); // Trigger fade-out
          const redirectTimer = setTimeout(() => {
            navigate('/', { replace: true });
          }, 1000); // Delay for fade-out effect

          return () => clearTimeout(redirectTimer); // Cleanup redirect timer
        }, 1000); // Initial delay before starting fade-out

        return () => clearTimeout(timer); // Cleanup timer
      }
    };

    logout(); // Call the logout function
  }, [navigate, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className={`text-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        {loading ? ( // Conditional rendering based on loading state
          <>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Logging out...</h2>
            <p className="text-gray-500">Please wait while we sign you out.</p>
          </>
        ) : (
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">You have been logged out.</h2>
        )}
      </div>
    </div>
  );
};

export default LogoutPage; 
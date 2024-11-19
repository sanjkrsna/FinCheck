import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const CACHE_KEYS = {
  HISTORICAL_DATA: 'historicalMarketData',
  NEWS_DATA: 'newsData',
  WORLD_MARKETS: 'worldMarketsData',
  WATCHLIST: 'watchlistData',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
};

const LogoutPage = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const logout = async () => {
      try {
        const accessToken = localStorage.getItem(CACHE_KEYS.ACCESS_TOKEN) || 
                           sessionStorage.getItem(CACHE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(CACHE_KEYS.REFRESH_TOKEN) || 
                           sessionStorage.getItem(CACHE_KEYS.REFRESH_TOKEN);

        if (accessToken && refreshToken) {
          const config = {
            headers: { "Authorization": `Bearer ${accessToken}` }
          };
          await axios.post("http://127.0.0.1:8000/api/logout/", 
            { "refresh": refreshToken }, 
            config
          );
        }
      } catch (error) {
        console.error("Failed to logout", error.response?.data || error.message);
      } finally {
        // Clear all caches
        Object.values(CACHE_KEYS).forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        setIsAuthenticated(false);
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
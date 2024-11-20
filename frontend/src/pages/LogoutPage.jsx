import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { clearAIChatHistory } from '../components/views/AIAssistantView';

const CACHE_KEYS = {
  HISTORICAL_DATA: 'historicalMarketData',
  NEWS_DATA: 'newsData',
  WORLD_MARKETS: 'worldMarketsData',
  WATCHLIST: 'watchlistData',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
};

const clearAllCaches = () => {
  // Clear all general caches
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Clear user-specific AI chat caches
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  if (userId) {
    localStorage.removeItem(`ai_chat_history_${userId}`);
    localStorage.removeItem(`ai_chat_history_${userId}_stocks`);
    localStorage.removeItem(`ai_chat_history_${userId}_selected`);
  }

  // Clear any remaining AI-related caches
  clearAIChatHistory();

  // Clear any items with 'cache' in their key
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('cache') || key.includes('history'))) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear userId last
  localStorage.removeItem('userId');
  sessionStorage.removeItem('userId');
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
        clearAllCaches();
        
        setIsAuthenticated(false);
        toast.success('Successfully logged out!', {
          position: "top-center",
          autoClose: 2000,
        });

        // Start fade-out animation
        setFadeOut(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    };

    logout();
  }, [navigate, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className={`text-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          {loading ? 'Logging out...' : 'You have been logged out.'}
        </h2>
        <p className="text-gray-500">Please wait while we sign you out.</p>
      </div>
    </div>
  );
};

export default LogoutPage; 
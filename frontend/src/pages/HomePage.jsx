import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

import HomeView from '../components/views/HomeView';
import PortfolioView from '../components/views/PortfolioView';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeMenu, setActiveMenu] = useState('home');
  const [first_name, setFirstname] = useState('');
  const [last_name, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const { isAuthenticated, checkAuth } = useAuth();
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeOutLogout, setFadeOutLogout] = useState(false);

  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowUserDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (token) {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const response = await axios.get('http://127.0.0.1:8000/api/user/', config);
          setFirstname(response.data.first_name);
          setLastname(response.data.last_name);
          setEmail(response.data.email);
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    if (isAuthenticated) {
      fetchUserData();
      setFadeIn(true);
    }
  }, [isAuthenticated]);

  const handleLoginClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleLogoutClick = () => {
    setFadeOutLogout(true);
    setTimeout(() => {
      navigate('/logout');
    }, 1000);
  };

  const handleNavigation = (route) => {
    if (route === 'home' && location.pathname === '/') {
      return;
    }
    navigate(route === 'home' ? '/' : `/${route}`);
  };

  useEffect(() => {
    const path = location.pathname.split('/')[1];
    setActiveMenu(path || 'home');
  }, [location]);

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-16 flex-shrink-0 flex flex-col items-center py-4 border-r border-white/20 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500 animate-gradient">
        <div className="mb-6">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08 .402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center space-y-6">
          <button
            onClick={() => handleNavigation('home')}
            className={`p-2 rounded-lg text-white transition-colors ${
              (location.pathname === '/' || location.pathname === '/home') ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>

          <button
            onClick={() => handleNavigation('stock')}
            className={`p-2 rounded-lg text-white transition-colors ${
              location.pathname.startsWith('/stock') ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => handleNavigation('ai-assistant')}
            className={`p-2 rounded-lg text-white transition-colors ${
              location.pathname.startsWith('/ai-assistant') ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </button>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => handleNavigation('settings')}
            className={`p-2 rounded-lg text-white transition-colors ${
              location.pathname.startsWith('/settings') ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <nav className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient p-4 flex items-center shadow-sm border-b border-white/20">
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-auto relative">
            <button 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-8 h-8 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {first_name && last_name ? `${first_name[0]}${last_name[0]}` : ''}
            </button>

            {showUserDropdown && (
              <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50 transition-transform transform hover:scale-105 border border-blue-200 glow-effect">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold text-gray-800">{first_name} {last_name}</p>
                  <p className="text-xs text-gray-500">{email}</p>
                </div>
                <div className="px-4 py-2 flex flex-col items-center space-y-2">
                  <button 
                    onClick={() => {
                      handleNavigation('settings');
                      setShowUserDropdown(false);
                    }} 
                    className="text-sm text-gray-600 hover:bg-blue-500 hover:text-white block w-full text-center py-1 transition-colors rounded-lg"
                  >
                    Settings
                  </button>
                  <button 
                    onClick={handleLogoutClick} 
                    className="text-sm text-gray-600 hover:bg-red-300 hover:text-white block w-full text-center py-1 transition-colors rounded-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
        
        
        <main className="flex-1 p-4 bg-gray-50 h-[calc(100vh-4rem)] overflow-auto">
          <Outlet />
        </main>
      </main>
    </div>
  );
};

export default HomePage;

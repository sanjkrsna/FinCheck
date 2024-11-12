import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import HomeView from '../components/views/HomeView';
import PortfolioView from '../components/views/PortfolioView';
import AnalyticsView from '../components/views/AnalyticsView';
import SettingsView from '../components/views/SettingsView';

const HomePage = () => {
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

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'home':
        return <HomeView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className={`flex min-h-screen transition-opacity duration-1000 ${fadeOutLogout ? 'opacity-0' : 'opacity-100'}`}>
      <ToastContainer position="top-center" limit={1} theme="light" />
      <aside className="w-16 flex flex-col items-center py-4 border-r border-white/20 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500 animate-gradient">
        <div className="mb-6">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08 .402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center space-y-6">
          <button
            onClick={() => setActiveMenu('home')}
            className={`p-2 rounded-lg text-white transition-colors ${
              activeMenu === 'home' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>

          <button
            onClick={() => setActiveMenu('portfolio')}
            className={`p-2 rounded-lg text-white transition-colors ${
              activeMenu === 'portfolio' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => setActiveMenu('analytics')}
            className={`p-2 rounded-lg text-white transition-colors ${
              activeMenu === 'analytics' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setActiveMenu('settings')}
          className={`p-2 rounded-lg text-white transition-colors mb-4 ${
            activeMenu === 'settings' ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </aside>

      <div className={`flex-1 flex flex-col transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <nav className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient p-4 flex items-center shadow-sm border-b border-white/20">
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="search"
                placeholder="Search..."
                className="w-full px-4 py-2 bg-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder:text-white/60"
              />
              <svg className="w-5 h-5 absolute right-3 top-2.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-auto relative">
            <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
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
                <div className="px-4 py-2 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Portfolio Value</span>
                    <span className="text-sm font-semibold text-gray-800">$45,231.89</span>
                  </div>
                </div>
                <div className="px-4 py-2 flex flex-col items-center">
                  <button className="text-sm text-gray-600 hover:bg-blue-300 hover:text-white block w-full text-center py-1 transition-colors mb-1 rounded-lg">Settings</button>
                  <button onClick={handleLogoutClick} className="text-sm text-gray-600 hover:bg-red-300 hover:text-white block w-full text-center py-1 transition-colors rounded-lg">Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </nav>
        
        
        <main className="flex-1 p-4 bg-gray-50 h-[calc(100vh-4rem)] overflow-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default HomePage;

// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LogoutPage from './pages/LogoutPage';
import HomeView from './components/views/HomeView';
import PortfolioView from './components/views/PortfolioView';
import WatchlistView from './components/views/WatchlistView';
import AnalyticsView from './components/views/AnalyticsView';
import SettingsView from './components/views/SettingsView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      
      <Route element={<ProtectedRoute><HomePage /></ProtectedRoute>}>
        <Route path="/home" element={<HomeView />} />
        <Route path="/portfolio" element={<PortfolioView />} />
        <Route path="/watchlist" element={<WatchlistView />} />
        <Route path="/analytics" element={<AnalyticsView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>
    </Routes>
  );
}

export default App;


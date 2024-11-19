// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LogoutPage from './pages/LogoutPage';
import HomeView from './components/views/HomeView';
import PortfolioView from './components/views/PortfolioView';
import ProtectedRoute from './components/ProtectedRoute';
import StockDashboard from './components/views/StockDashboard';
import ForgotPassword from './components/ForgotPassword';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>}>
        <Route path="home" element={<HomeView />} />
        <Route path="stock" element={<PortfolioView />} />
        <Route path="stock/:stockName" element={<StockDashboard />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;


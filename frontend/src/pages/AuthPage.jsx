import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SignUpForm from '../components/SignUpForm';
import LoginForm from '../components/LoginForm';
import GradientBackground from '../components/GradientBackground';

const FEATURES = [
  'Time Series Analysis',
  'Fundamental Analysis',
  'Market Sentiment',
  'Long Term Recommendation',
];

const BUBBLES = [
  { size: 'w-6 h-6', delay: '0s', position: '-top-3 -right-3' },
  { size: 'w-8 h-8', delay: '-2s', position: '-bottom-4 -left-4' },
  { size: 'w-12 h-12', delay: '-4s', position: 'top-1/2 -right-6' },
];

const AuthPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: '0%', y: '0%' });
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const isHome = location.pathname === '/';

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - 50;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - 50;
    setMousePosition({
      x: `${(x * 0.4).toFixed(3)}%`,
      y: `${(y * 0.4).toFixed(3)}%`,
    });
  }, []);

  const gradientStyle = useMemo(() => ({
    background: `
      radial-gradient(circle at calc(50% + ${mousePosition.x}) calc(100% + ${mousePosition.y}), rgba(37,99,235,1) 0%, rgba(37,99,235,0.3) 85%),
      radial-gradient(circle at calc(0% + ${mousePosition.x}) calc(0% + ${mousePosition.y}), rgba(29,78,216,1) 0%, rgba(29,78,216,0.3) 85%),
      radial-gradient(circle at calc(100% + ${mousePosition.x}) calc(0% + ${mousePosition.y}), rgba(30,64,175,1) 0%, rgba(30,64,175,0.3) 85%),
      #1e40af
    `
  }), [mousePosition]);

  const styles = `
    @keyframes slideIn {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(10px, -10px) rotate(5deg); }
      75% { transform: translate(-10px, 10px) rotate(-5deg); }
    }
    .catchphrase {
      font-family: Inter, system-ui, sans-serif;
      animation: slideIn 0.8s ease-out forwards;
      letter-spacing: -0.05em;
    }
    .floating-bubble {
      animation: float 6s ease-in-out infinite;
      position: absolute;
      opacity: 0.2;
      background: rgb(37, 99, 235);
      border-radius: 9999px;
    }
  `;

  return (
    <div className="flex min-h-screen">
      <GradientBackground className="w-[60%]">
        <div className="p-12 flex flex-col justify-center h-full">
          <h1 className="text-4xl font-bold text-white mb-6">
            Long Term Investment Analysis and Recommendation System
          </h1>
          <p className="text-lg text-white mb-8">
            Empowering you with insightful data for smarter investments.
          </p>
          <div className="space-y-4">
            {FEATURES.map((feature, index) => (
              <div key={index} className="bg-white bg-opacity-20 p-4 rounded-md text-white">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </GradientBackground>

      <div className="w-[40%] bg-gradient-to-br from-gray-50 to-gray-100 rounded-l-3xl">
        <div className="h-full flex flex-col items-center justify-center px-12">
          <style>{styles}</style>
          <div className="text-center mb-8">
            <h2 className="catchphrase text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
              Invest Smarter
            </h2>
          </div>

          <div className="w-full max-w-md bg-white shadow-xl rounded-[2rem] p-8 relative">
            {BUBBLES.map(({ size, delay, position }, index) => (
              <div
                key={index}
                className={`floating-bubble ${size} ${position}`}
                style={{ animationDelay: delay }}
              />
            ))}
            
            {isHome ? (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2 text-gray-700">Welcome Back!</h2>
                <p className="text-gray-500 mb-6">
                  Access your personalized investment insights and recommendations.
                </p>
                <button
                
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login
                </button>
                <div className="flex items-center my-4">
                  <hr className="flex-grow border-gray-300" />
                  <span className="px-2 text-gray-400 font-medium">or</span>
                  <hr className="flex-grow border-gray-300" />
                </div>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <>
                {isLogin ? <LoginForm /> : <SignUpForm />}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      onClick={() => navigate(isLogin ? '/signup' : '/login')}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      {isLogin ? 'Sign up' : 'Login'} now
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
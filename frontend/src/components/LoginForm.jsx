import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/toast.css';

const TOAST_CONFIG = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  className: 'rounded-lg',
  bodyClassName: "font-sans text-sm",
  style: {
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  progressStyle: {
    background: '#2563eb'
  },
  toastClassName: 'rounded-lg shadow-lg border border-gray-100'
};

const ToastMessage = ({ icon, title, message }) => (
  <div className="flex items-center">
    {icon}
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </div>
);

function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', formData);
      
      if (rememberDevice) {
        localStorage.setItem("accessToken", response.data.tokens.access);
        localStorage.setItem("refreshToken", response.data.tokens.refresh);
      } else {
        sessionStorage.setItem("accessToken", response.data.tokens.access);
        sessionStorage.setItem("refreshToken", response.data.tokens.refresh);
      }
      
      toast.success(
        <ToastMessage
          icon={<svg className="w-5 h-5 mr-2 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>}
          title="Successfully logged in!"
          message="Redirecting to dashboard..."
        />,
        TOAST_CONFIG
      );

      setTimeout(() => navigate('/home', { replace: true }), 3000);
    } catch (error) {
      toast.error(
        <ToastMessage
          icon={<svg className="w-5 h-5 mr-2 text-red-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"></path></svg>}
          title="Login failed"
          message="Please check your credentials and try again."
        />,
        { ...TOAST_CONFIG, autoClose: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        limit={1}
        theme="light"
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input 
            type="email" 
            id="loginEmail" 
            name="email"
            value={formData.email} 
            required 
            placeholder='example@example.com'  
            className="block w-full p-1 rounded-lg border border-gray-30 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            onChange={handleChange}  
          />
        </div>
        <div>
          <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            id="loginPassword" 
            name="password" 
            placeholder='password*' 
            required
            value={formData.password}
            className="block w-full p-1 rounded-lg border border-gray-30 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50" 
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="rememberDevice"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <label htmlFor="rememberDevice" className="ml-2 text-sm text-gray-600">
            Remember this device
          </label>
        </div>
        {errorMessage && (
          <div className="text-red-500 text-sm mt-2">
            {errorMessage}
          </div>
        )}
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </>
  );
}

export default LoginForm;

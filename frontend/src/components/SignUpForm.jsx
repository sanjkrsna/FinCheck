import React, { useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/toast.css';

const INITIAL_FORM_STATE = {
  first_name: "",
  last_name: "",
  email: "",
  password1: "",
  password2: "",
};

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

function SignUpForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
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
      const response = await axios.post(
        'http://127.0.0.1:8000/api/register/', 
        { ...formData, username: formData.email }
      );
      
      toast.success(
        <ToastMessage
          icon={
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          }
          title="Successfully registered!"
          message="Redirecting to login..."
        />,
        TOAST_CONFIG
      );

      setTimeout(() => navigate('/login'), 3000);

    } catch (error) {
      console.error("Registration error:", error.response?.data);
      
      toast.error(
        <ToastMessage
          icon={
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          }
          title="Registration failed"
          message="Please try again."
        />,
        { ...TOAST_CONFIG, autoClose: 5000 }
      );
      
      setErrorMessage("Error encountered during registration. Please try again.");
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
            <input 
              type="text" 
              id="first_name" 
              name="first_name" 
              value={formData.first_name} 
              required 
              placeholder="First Name" 
              className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
              onChange={handleChange} 
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input 
              type="text" 
              id="last_name" 
              name="last_name"  
              value={formData.last_name} 
              required 
              placeholder="Last Name" 
              className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            required 
            placeholder="example@example.com" 
            className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            onChange={handleChange} 
          />
        </div>
        <div>
          <label htmlFor="password1" className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            id="password1" 
            name="password1"  
            value={formData.password1} 
            required 
            placeholder="Password" 
            className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            onChange={handleChange} 
          />
        </div>
        <div>
          <label htmlFor="password2" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input 
            type="password" 
            id="password2" 
            name="password2"  
            value={formData.password2} 
            required 
            placeholder="Confirm Password" 
            className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            onChange={handleChange} 
          />
        </div>
        <button 
          type="submit" 
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </>
  );
}

export default SignUpForm;

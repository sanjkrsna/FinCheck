import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/password/reset/request/', {
        email
      });
      toast.success('OTP sent successfully! Please check your email.', TOAST_CONFIG);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong', TOAST_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/password/reset/verify-otp/', {
        email,
        otp
      });
      toast.success('OTP verified successfully!', TOAST_CONFIG);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP', TOAST_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', TOAST_CONFIG);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/password/reset/confirm/', {
        email,
        password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success('Password reset successful!', TOAST_CONFIG);
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password reset failed', TOAST_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <ToastContainer
          position="top-center"
          limit={1}
          theme="light"
        />
        
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Reset Password
          </h2>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP</label>
              <input
                id="otp"
                type="text"
                required
                className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="new-password"
                type="password"
                required
                className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                required
                className="block w-full p-1 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Password reset successful. You can now login with your new password.</p>
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
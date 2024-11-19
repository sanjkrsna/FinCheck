import { useState, useEffect } from 'react';
import axios from 'axios';
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

const Settings = () => {
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:8000/api/user/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        setProfileData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || ''
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        toast.error('Failed to load user data', TOAST_CONFIG);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate inputs
    if (!profileData.first_name.trim() || !profileData.last_name.trim()) {
      toast.error('Both first name and last name are required', TOAST_CONFIG);
      setIsLoading(false);
      return;
    }
    
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    try {
      const response = await axios.put(
        'http://localhost:8000/api/profile/update/',
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('Profile update response:', response.data); // Debug log
      toast.success('Profile updated successfully! 🎉', TOAST_CONFIG);
      
      // Update the UI immediately
      setProfileData({
        first_name: response.data.first_name || profileData.first_name,
        last_name: response.data.last_name || profileData.last_name
      });
    } catch (err) {
      console.error('Profile update error:', err.response); // Debug log
      
      if (err.response?.data?.first_name) {
        toast.error(`First name error: ${err.response.data.first_name[0]}`, TOAST_CONFIG);
      } else if (err.response?.data?.last_name) {
        toast.error(`Last name error: ${err.response.data.last_name[0]}`, TOAST_CONFIG);
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail, TOAST_CONFIG);
      } else {
        toast.error('Failed to update profile. Please try again.', TOAST_CONFIG);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!passwordData.old_password) {
      toast.error('Please enter your current password', TOAST_CONFIG);
      return;
    }
    
    if (!passwordData.new_password) {
      toast.error('Please enter a new password', TOAST_CONFIG);
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match', TOAST_CONFIG);
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long', TOAST_CONFIG);
      return;
    }

    if (passwordData.new_password === passwordData.old_password) {
      toast.error('New password must be different from current password', TOAST_CONFIG);
      return;
    }
    
    setIsLoading(true);
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    try {
      // Only send required fields to match backend serializer
      const response = await axios.post(
        'http://localhost:8000/api/password/change/',
        {
          old_password: passwordData.old_password,
          new_password: passwordData.new_password
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      toast.success('Password changed successfully! 🔒', TOAST_CONFIG);
      
      // Clear form
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      console.error('Password change error:', err.response?.data); // More detailed error logging
      
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.', TOAST_CONFIG);
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error, TOAST_CONFIG);
      } else if (err.response?.data?.old_password) {
        toast.error(err.response.data.old_password[0], TOAST_CONFIG);
      } else if (err.response?.data?.new_password) {
        toast.error(err.response.data.new_password[0], TOAST_CONFIG);
      } else {
        toast.error('Failed to change password. Please try again.', TOAST_CONFIG);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    const first = profileData.first_name?.charAt(0) || '';
    const last = profileData.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-semibold">
              {getInitials()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Account Settings</h1>
              <p className="text-white/80">Manage your profile and security</p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-8">
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full md:w-auto px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                    isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full p-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full p-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full p-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full md:w-auto px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                    isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <ToastContainer
        position="top-center"
        limit={1}
        theme="light"
      />
    </div>
  );
};

export default Settings; 
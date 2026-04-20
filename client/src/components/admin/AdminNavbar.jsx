import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useAuth } from '../../context/AuthContext';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(); // Clear admin session
    navigate('/login', { replace: true }); // Go to login page
  };

  return (
    <div className='flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/10 bg-black/20 backdrop-blur-md'>
      {/* Logo */}
      <Link to='/'>
        <img src={assets.logo} alt="logo" className='w-36 h-auto' />
      </Link>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className='bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded'
      >
        Logout
      </button>
    </div>
  );
};

export default AdminNavbar;

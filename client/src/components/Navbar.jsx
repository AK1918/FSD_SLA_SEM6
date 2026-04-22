import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, LayoutDashboard, ClipboardList, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
          <Leaf size={28} />
          <span>EcoBite</span>
        </Link>
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              {user.role === 'vendor' ? (
                <>
                  <Link to="/dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors">
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/inventory" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors">
                    <ClipboardList size={20} />
                    <span>Inventory</span>
                  </Link>
                </>
              ) : (
                <Link to="/ngo-dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors">
                  <LayoutDashboard size={20} />
                  <span>NGO Dashboard</span>
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center space-x-1 text-primary font-bold hover:text-secondary transition-colors">
              <LogIn size={20} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

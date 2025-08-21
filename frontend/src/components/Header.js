import React from 'react';
import { useAuth } from '../App';
import { Menu, Bell } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/plants':
        return 'Plants & Inventory';
      case '/bills':
        return 'Bills Management';
      case '/quotations':
        return 'Quotations';
      case '/customers':
        return 'Customer Management';
      case '/orders':
        return 'Orders';
      case '/waste':
        return 'Waste Management';
      case '/maintenance':
        return 'Maintenance';
      case '/payments':
        return 'Payment Management';
      case '/users':
        return 'User Management';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="header">
      <button
        onClick={onMenuClick}
        className="header-menu-btn"
      >
        <Menu className="w-6 h-6" />
      </button>

      <h1 className="header-title">{getPageTitle()}</h1>

      <div className="header-user">
        <button className="p-2 text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="user-info">
          <p className="user-name">{user?.full_name}</p>
          <p className="user-role">{user?.role}</p>
        </div>
        
        <div className="user-avatar">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import {
  LayoutDashboard,
  Leaf,
  Receipt,
  FileText,
  Users,
  Settings,
  LogOut,
  X,
  ShoppingCart,
  Package,
  AlertTriangle,
  Wrench,
  CreditCard
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Plants & Inventory', href: '/plants', icon: Leaf, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Bills', href: '/bills', icon: Receipt, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Quotations', href: '/quotations', icon: FileText, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Waste Management', href: '/waste', icon: AlertTriangle, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['admin', 'manager', 'cashier'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin', 'manager', 'cashier'] },
    { name: 'User Management', href: '/users', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <div className="sidebar-brand">
            <h2 className="sidebar-title">Shree Krishna Nursery</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop brand */}
        <div className="sidebar-brand hidden lg:block">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3">
              <img 
                src="/image.png" 
                alt="Shree Krishna Nursery Logo" 
                className="w-10 h-10 object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
                <Leaf className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="sidebar-title">Shree Krishna</h2>
              <p className="text-sm text-gray-500">Nursery</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="user-name">{user?.full_name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon className="nav-icon" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            <LogOut className="nav-icon" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
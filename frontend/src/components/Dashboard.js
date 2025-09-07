import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Receipt,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  FileText
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-emerald-100">
              Here's what's happening at Shree Krishna Nursery today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white bg-opacity-20 rounded-full p-4 flex items-center justify-center">
              <img 
                src="/image.png" 
                alt="Shree Krishna Nursery Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Package className="w-8 h-8 hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="stat-value">{formatCurrency(analytics?.total_sales)}</div>
          <div className="stat-label">Total Sales</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Package className="w-6 h-6" />
          </div>
          <div className="stat-value">{analytics?.total_plants || 0}</div>
          <div className="stat-label">Total Plants</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="stat-value">{analytics?.low_stock_alerts || 0}</div>
          <div className="stat-label">Low Stock Alerts</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="stat-value">{analytics?.recent_bills?.length || 0}</div>
          <div className="stat-label">Recent Bills</div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Recent Bills</h3>
          </div>
          <div className="overflow-x-auto">
            {analytics?.recent_bills?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="font-medium">{bill.bill_number}</td>
                      <td>{bill.customer_name}</td>
                      <td className="font-medium text-emerald-600">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${
                          bill.status === 'approved' ? 'success' : 
                          bill.status === 'pending' ? 'warning' : 'info'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>{formatDate(bill.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent bills found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/bills"
              className="flex items-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Receipt className="w-5 h-5 text-emerald-600 mr-3" />
              <div>
                <p className="font-medium text-emerald-900">Create New Bill</p>
                <p className="text-sm text-emerald-600">Generate sales invoice</p>
              </div>
            </a>

            <a
              href="/quotations"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-900">New Quotation</p>
                <p className="text-sm text-blue-600">Create price estimate</p>
              </div>
            </a>

            <a
              href="/plants"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-900">Manage Inventory</p>
                <p className="text-sm text-green-600">Update plant stock</p>
              </div>
            </a>

            <a
              href="/customers"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Users className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-purple-900">Add Customer</p>
                <p className="text-sm text-purple-600">Register new customer</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Role-specific notifications */}
      {user?.role === 'admin' && analytics?.low_stock_alerts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 mr-3" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Low Stock Alert</h3>
              <p className="text-amber-700">
                {analytics.low_stock_alerts} plants are running low on stock. 
                <a href="/plants" className="font-medium underline ml-1">
                  Review inventory →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Leaf } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full overflow-hidden">
              <img 
                src="/image.png" 
                alt="Shree Krishna Nursery Logo" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
                <Leaf className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
          <h1 className="login-title">Shree Krishna Nursery</h1>
          <p className="login-subtitle">Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="spinner mr-2"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <div className="border-t border-gray-200 pt-4">
            <p className="font-medium text-gray-900 mb-2">Default Login Credentials:</p>
            <div className="space-y-1 text-xs">
              <p><strong>Admin:</strong> username: admin, password: admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
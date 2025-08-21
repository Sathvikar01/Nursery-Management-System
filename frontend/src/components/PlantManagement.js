import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  AlertTriangle,
  Package,
  TrendingDown
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlantManagement = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    variants: [],
    current_stock: 0,
    min_stock_threshold: 10,
    cost_price: 0,
    selling_price: 0,
    investment: 0,
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchPlants();
  }, [showLowStock]);

  const fetchPlants = async () => {
    try {
      const endpoint = showLowStock ? `${API}/plants/low-stock` : `${API}/plants`;
      const response = await axios.get(endpoint);
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const plantData = {
        ...formData,
        variants: formData.variants.filter(v => v.trim() !== ''),
        current_stock: parseInt(formData.current_stock),
        min_stock_threshold: parseInt(formData.min_stock_threshold),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        investment: parseFloat(formData.investment)
      };

      if (editingPlant) {
        await axios.put(`${API}/plants/${editingPlant.id}`, plantData);
      } else {
        await axios.post(`${API}/plants`, plantData);
      }

      setShowModal(false);
      setEditingPlant(null);
      resetForm();
      fetchPlants();
    } catch (error) {
      console.error('Error saving plant:', error);
      alert('Error saving plant: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      variants: [],
      current_stock: 0,
      min_stock_threshold: 10,
      cost_price: 0,
      selling_price: 0,
      investment: 0,
      location: '',
      description: ''
    });
  };

  const openEditModal = (plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name,
      category: plant.category,
      variants: plant.variants || [],
      current_stock: plant.current_stock,
      min_stock_threshold: plant.min_stock_threshold,
      cost_price: plant.cost_price,
      selling_price: plant.selling_price,
      investment: plant.investment,
      location: plant.location,
      description: plant.description || ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingPlant(null);
    resetForm();
    setShowModal(true);
  };

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStockStatus = (plant) => {
    if (plant.current_stock <= 0) return { status: 'out', color: 'danger', text: 'Out of Stock' };
    if (plant.current_stock <= plant.min_stock_threshold) return { status: 'low', color: 'warning', text: 'Low Stock' };
    return { status: 'good', color: 'success', text: 'In Stock' };
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
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plants & Inventory</h1>
            <p className="text-gray-600">Manage your nursery plant inventory</p>
          </div>
          
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={openCreateModal}
              className="btn btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Plant
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search plants..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`btn ${showLowStock ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showLowStock ? 'Show All' : 'Low Stock Only'}
          </button>
        </div>
      </div>

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlants.map((plant) => {
          const stockStatus = getStockStatus(plant);
          return (
            <div key={plant.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plant.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{plant.category}</p>
                  <span className={`badge ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
                
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <button
                    onClick={() => openEditModal(plant)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <span className="font-medium text-gray-900">{plant.current_stock}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Min Threshold:</span>
                  <span className="font-medium text-gray-900">{plant.min_stock_threshold}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Selling Price:</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(plant.selling_price)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">{plant.location}</span>
                </div>

                {plant.variants && plant.variants.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Variants:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {plant.variants.map((variant, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {variant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {plant.current_stock <= plant.min_stock_threshold && (
                  <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Restock needed</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlants.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showLowStock ? 'No low stock plants' : 'No plants found'}
          </h3>
          <p className="text-gray-600">
            {showLowStock 
              ? 'All plants are adequately stocked' 
              : searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start by adding your first plant to the inventory'
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Plant Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Stock *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Stock Threshold *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.min_stock_threshold}
                      onChange={(e) => setFormData({...formData, min_stock_threshold: e.target.value})}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cost Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Investment *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.investment}
                      onChange={(e) => setFormData({...formData, investment: e.target.value})}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingPlant ? 'Update Plant' : 'Add Plant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantManagement;
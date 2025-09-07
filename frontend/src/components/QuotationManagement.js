import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { 
  Plus, 
  Search, 
  FileText, 
  Eye, 
  Trash2,
  Calendar,
  CheckCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationManagement = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [plants, setPlants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    items: [],
    tax: 0,
    discount: 0,
    valid_days: 30
  });

  const [currentItem, setCurrentItem] = useState({
    plant_id: '',
    plant_name: '',
    variant: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0
  });

  useEffect(() => {
    fetchQuotations();
    fetchPlants();
    fetchCustomers();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(`${API}/quotations`);
      setQuotations(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await axios.get(`${API}/plants`);
      setPlants(response.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/quotations`, formData);
      setShowModal(false);
      resetForm();
      fetchQuotations();
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Error creating quotation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      items: [],
      tax: 0,
      discount: 0,
      valid_days: 30
    });
    setCurrentItem({
      plant_id: '',
      plant_name: '',
      variant: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    });
  };

  const addItem = () => {
    if (!currentItem.plant_id || !currentItem.quantity || !currentItem.unit_price) {
      alert('Please fill all item details');
      return;
    }

    const selectedPlant = plants.find(p => p.id === currentItem.plant_id);
    const item = {
      ...currentItem,
      plant_name: selectedPlant?.name || '',
      total_price: currentItem.quantity * currentItem.unit_price
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    setCurrentItem({
      plant_id: '',
      plant_name: '',
      variant: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handlePlantChange = (plantId) => {
    const selectedPlant = plants.find(p => p.id === plantId);
    setCurrentItem({
      ...currentItem,
      plant_id: plantId,
      plant_name: selectedPlant?.name || '',
      unit_price: selectedPlant?.selling_price || 0,
      total_price: currentItem.quantity * (selectedPlant?.selling_price || 0)
    });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_price, 0);
    return subtotal + formData.tax - formData.discount;
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const filteredQuotations = quotations.filter(quotation =>
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      day: 'numeric'
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
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
            <p className="text-gray-600">Create and manage price quotations</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quotation
          </button>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search quotations..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quotations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQuotations.map((quotation) => (
          <div key={quotation.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{quotation.quotation_number}</h3>
                <p className="text-sm text-gray-600 mb-2">{quotation.customer_name}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Valid until {formatDate(quotation.valid_until)}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`badge ${
                  quotation.status === 'converted' ? 'success' : 
                  isExpired(quotation.valid_until) ? 'danger' : 'info'
                }`}>
                  {isExpired(quotation.valid_until) && quotation.status === 'active' ? 'Expired' : quotation.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Items:</span>
                <span className="font-medium text-gray-900">{quotation.items.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(quotation.total_amount)}</span>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-3">
                  Created on {formatDate(quotation.created_at)}
                </div>
                
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-secondary flex-1 flex items-center justify-center">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </button>
                  
                  {quotation.status === 'active' && !isExpired(quotation.valid_until) && (
                    <button className="btn btn-sm btn-success flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Convert
                    </button>
                  )}
                  
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button className="btn btn-sm btn-danger">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuotations.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first quotation'}
          </p>
        </div>
      )}

      {/* Create Quotation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="modal-header">
              <h2 className="modal-title">Create New Quotation</h2>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-6">
                {/* Customer and Validity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Customer *</label>
                    <select
                      className="form-input"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valid Days *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.valid_days}
                      onChange={(e) => setFormData({...formData, valid_days: parseInt(e.target.value) || 30})}
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Add Items Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Add Items</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="form-label">Plant</label>
                      <select
                        className="form-input"
                        value={currentItem.plant_id}
                        onChange={(e) => handlePlantChange(e.target.value)}
                      >
                        <option value="">Select Plant</option>
                        {plants.map(plant => (
                          <option key={plant.id} value={plant.id}>
                            {plant.name} - {formatCurrency(plant.selling_price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Variant</label>
                      <input
                        type="text"
                        className="form-input"
                        value={currentItem.variant}
                        onChange={(e) => setCurrentItem({...currentItem, variant: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({
                          ...currentItem, 
                          quantity: parseInt(e.target.value) || 0,
                          total_price: (parseInt(e.target.value) || 0) * currentItem.unit_price
                        })}
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="form-label">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={currentItem.unit_price}
                        onChange={(e) => setCurrentItem({
                          ...currentItem, 
                          unit_price: parseFloat(e.target.value) || 0,
                          total_price: currentItem.quantity * (parseFloat(e.target.value) || 0)
                        })}
                        min="0"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addItem}
                        className="btn btn-primary w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Quotation Items</h4>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{item.plant_name}</span>
                            {item.variant && <span className="text-gray-600 ml-2">({item.variant})</span>}
                            <div className="text-sm text-gray-600">
                              {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tax and Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tax Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.tax}
                      onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                </div>

                {/* Total Display */}
                {formData.items.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-blue-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>
                )}
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
                  disabled={formData.items.length === 0}
                  onClick={(e) => {
                    if (formData.items.length === 0) {
                      e.preventDefault();
                      alert('Please add at least one item to the quotation');
                      return;
                    }
                    if (formData.valid_days < 1) {
                      e.preventDefault();
                      alert('Quotation validity must be at least 1 day');
                      return;
                    }
                  }}
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;
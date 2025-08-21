import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  Clock,
  Receipt,
  Trash2,
  ShoppingCart
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BillManagement = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [pendingBills, setPendingBills] = useState([]);
  const [plants, setPlants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    items: [],
    tax: 0,
    discount: 0,
    payment_method: 'cash'
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
    fetchBills();
    fetchPlants();
    fetchCustomers();
    if (user?.role === 'admin') {
      fetchPendingBills();
    }
  }, [user]);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${API}/bills`);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBills = async () => {
    try {
      const response = await axios.get(`${API}/bills/pending`);
      setPendingBills(response.data);
    } catch (error) {
      console.error('Error fetching pending bills:', error);
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
      await axios.post(`${API}/bills`, formData);
      setShowModal(false);
      resetForm();
      fetchBills();
      if (user?.role === 'admin') {
        fetchPendingBills();
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Error creating bill: ' + (error.response?.data?.detail || error.message));
    }
  };

  const approveBill = async (billId) => {
    try {
      await axios.put(`${API}/bills/${billId}/approve`);
      fetchBills();
      fetchPendingBills();
    } catch (error) {
      console.error('Error approving bill:', error);
      alert('Error approving bill: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      items: [],
      tax: 0,
      discount: 0,
      payment_method: 'cash'
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

  const filteredBills = bills.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bills Management</h1>
            <p className="text-gray-600">Create and manage sales bills</p>
          </div>
          
          <div className="flex gap-3">
            {user?.role === 'admin' && pendingBills.length > 0 && (
              <button
                onClick={() => setShowPendingModal(true)}
                className="btn btn-secondary flex items-center relative"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending Approvals
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingBills.length}
                </span>
              </button>
            )}
            
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Bill
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bills..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">All Bills</h3>
        </div>
        <div className="overflow-x-auto">
          {filteredBills.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-medium">{bill.bill_number}</td>
                    <td>{bill.customer_name}</td>
                    <td>{bill.items.length} items</td>
                    <td className="font-medium text-emerald-600">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td>
                      <span className="capitalize text-sm bg-gray-100 px-2 py-1 rounded">
                        {bill.payment_method}
                      </span>
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
                    <td>
                      <button className="btn btn-sm btn-secondary">
                        <Eye className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
              <p className="text-gray-600">Start by creating your first bill</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Bill Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="modal-header">
              <h2 className="modal-title">Create New Bill</h2>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-6">
                {/* Customer Selection */}
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
                    <h4 className="font-medium text-gray-900 mb-4">Bill Items</h4>
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

                {/* Bill Totals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-input"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                {/* Total Display */}
                {formData.items.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-emerald-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-emerald-600">
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
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Bills Modal */}
      {showPendingModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="modal-header">
              <h2 className="modal-title">Pending Bill Approvals</h2>
              <button
                onClick={() => setShowPendingModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="space-y-4">
                {pendingBills.map((bill) => (
                  <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{bill.bill_number}</h4>
                        <p className="text-sm text-gray-600">{bill.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatCurrency(bill.total_amount)}</p>
                        <p className="text-sm text-gray-600">{formatDate(bill.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {bill.items.length} items • {bill.payment_method} payment
                      </div>
                      <button
                        onClick={() => approveBill(bill.id)}
                        className="btn btn-success btn-sm flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowPendingModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
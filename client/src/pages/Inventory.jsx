import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';
import * as inventoryService from '../services/inventoryService';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Bakery',
    quantity: 1,
    unit: 'kg',
    expirationDate: '',
    price: 0
  });

  const categories = ['Bakery', 'Dairy', 'Produce', 'Meat', 'Pantry'];
  const units = ['kg', 'liters', 'units', 'packets'];

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch inventory');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const addedItem = await inventoryService.addInventoryItem(newItem);
      setInventory([...inventory, addedItem]);
      setNewItem({ name: '', category: 'Bakery', quantity: 1, unit: 'kg', expirationDate: '', price: 0 });
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await inventoryService.deleteInventoryItem(id);
      setInventory(inventory.filter(item => item._id !== id));
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Expiring Soon': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'Donated': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Discounted': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  if (loading && inventory.length === 0) return <div className="text-center py-20 text-gray-500">Loading inventory...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500">Add, track and manage your perishable food items</p>
      </header>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Item Form */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Plus size={20} className="text-primary" />
            <span>Add New Item</span>
          </h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-800"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 text-gray-800"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 text-gray-800"
                  value={newItem.expirationDate}
                  onChange={(e) => setNewItem({...newItem, expirationDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 text-gray-800"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 text-gray-800"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                >
                  {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
              <input 
                type="number" 
                step="0.01"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 text-gray-800"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-lg transition-colors shadow-md flex justify-center items-center space-x-2">
              <Plus size={20} />
              <span style={{color: 'Black'}}>Add to Inventory</span>
            </button>
          </form>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Current Inventory</h2>
            <button onClick={fetchInventory} className="text-primary hover:text-secondary text-sm font-medium flex items-center space-x-1">
              <CheckCircle size={16} />
              <span>Refresh List</span>
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Expires</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      {item.discountPrice > 0 && item.status === 'Expiring Soon' && (
                        <div className="text-xs text-amber-600 font-bold">Discounted: {item.discountPrice.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.category}</td>
                    <td className="px-6 py-4 text-gray-600">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>{new Date(item.expirationDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteItem(item._id)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">No items in inventory. Add one to get started!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;


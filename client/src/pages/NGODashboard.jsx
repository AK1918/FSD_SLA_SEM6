import React, { useState, useEffect } from 'react';
import * as inventoryService from '../services/inventoryService';
import { ShoppingCart, Bell, Package, Truck, CheckCircle, Clock, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveTrackingMap from '../components/LiveTrackingMap';

const NGODashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [requirement, setRequirement] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const [activeTracking, setActiveTracking] = useState(null);
  const requestsRef = React.useRef(requests);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  const fetchData = async () => {
    try {
      const [invData, reqData] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getRequests()
      ]);
      setInventory(invData);
      
      // Check if any request was just approved using Ref to avoid closure issues
      const approvedReq = reqData.find(r => 
        r.status === 'approved' && 
        !requestsRef.current.find(oldR => oldR._id === r._id && oldR.status === 'approved')
      );
      
      if (approvedReq) {
        setPopupMsg(`Your request for ${approvedReq.inventoryItem.name} has been APPROVED!`);
        setShowPopup(true);
      }

      setRequests(reqData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 10000); // Poll every 10s for live updates
    return () => clearInterval(interval);
  }, []); // Initial load and polling loop

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createRequest({
        vendorId: selectedItem.vendor._id,
        itemId: selectedItem._id,
        requirement,
        quantity: parseInt(quantity)
      });
      setSelectedItem(null);
      setRequirement('');
      setQuantity(1);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create request');
    }
  };

  const handleConfirmDelivery = async (id) => {
    try {
      // 1. Existing core logic
      await inventoryService.confirmDelivery(id);
      
      // 2. Kill-Switch: Terminate tracking session (Modular Extension)
      await inventoryService.terminateTrackingSession(id);

      setPopupMsg('Order confirmed as Delivered! Tracking terminated.');
      setShowPopup(true);
      fetchData();
    } catch (err) {
      alert('Failed to confirm delivery');
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle className="text-emerald-500" size={18} />;
      case 'dispatched': return <Truck className="text-blue-500" size={18} />;
      case 'delivered': return <Package className="text-gray-500" size={18} />;
      default: return <Clock className="text-amber-500" size={18} />;
    }
  };

  if (loading && inventory.length === 0) return <div className="text-center py-20 text-gray-500">Loading NGO Dashboard...</div>;

  return (
    <div className="space-y-10">
      {/* Notification Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 bg-emerald-500 text-white p-4 rounded-lg shadow-2xl flex items-center space-x-3"
          >
            <Bell size={24} />
            <span className="font-bold">{popupMsg}</span>
            <button onClick={() => setShowPopup(false)} className="ml-4 text-white hover:text-emerald-100 font-bold">X</button>
          </motion.div>
        )}
      </AnimatePresence>

      <header>
        <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
        <p className="text-gray-500">Browse available surplus food and track your requirements</p>
      </header>

      {/* Real-time Tracking Section */}
      {activeTracking && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-primary/20 shadow-xl shadow-primary/5 overflow-hidden"
        >
          <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-primary">
              <MapIcon size={20} />
              <h2 className="font-bold">Live Order Tracking</h2>
            </div>
            <button 
              onClick={() => setActiveTracking(null)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
              Close Map
            </button>
          </div>
          <div className="p-4">
            <LiveTrackingMap requestId={activeTracking} />
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Available Inventory */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <ShoppingCart className="text-primary" />
            <span>Available Surplus Food</span>
          </h2>
          <div className="grid gap-4">
            {inventory.filter(item => item.status !== 'Expired' && item.quantity > 0).map(item => (
              <div key={item._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">Vendor: {item.vendor.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'Donated' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm font-medium text-gray-600">{item.quantity} {item.unit} available</span>
                  <button 
                    onClick={() => setSelectedItem(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            ))}
            {inventory.length === 0 && <p className="text-gray-400 italic">No surplus food available right now.</p>}
          </div>
        </div>

        {/* My Requests & Tracking */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Truck className="text-blue-500" />
            <span>My Alerts & Order Tracking</span>
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req._id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{req.inventoryItem?.name}</p>
                      <p className="text-xs text-gray-500">{req.vendor?.name}</p>
                      {req.driver && (
                        <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Delivery Boy</p>
                          <p className="text-xs font-bold text-gray-700">{req.driver.name}</p>
                          <p className="text-[10px] text-gray-500">{req.driver.phone}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(req.status)}
                        <span className="font-medium capitalize">{req.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'dispatched' ? (
                        <div className="space-y-2">
                          <div className="bg-blue-50 text-blue-700 p-2 rounded text-xs font-bold animate-pulse">
                            {req.delivery?.trackingId || 'Order on the way!'}
                          </div>
                          <button 
                            onClick={() => setActiveTracking(req._id)}
                            className="w-full bg-primary hover:bg-secondary text-white text-[10px] font-bold py-1 px-2 rounded transition-colors uppercase flex items-center justify-center space-x-1"
                            style={{ color: 'black' }}
                          >
                            <MapIcon size={12} />
                            <span>Track Live</span>
                          </button>
                          <button 
                            onClick={() => handleConfirmDelivery(req._id)}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-1 px-2 rounded transition-colors uppercase"
                          >
                            Order Received
                          </button>
                        </div>
                      ) : req.status === 'delivered' ? (
                        <div className="text-emerald-600 text-xs font-bold flex flex-col">
                          <span>Received on:</span>
                          <span>{new Date(req.deliveredAt).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">{req.status === 'pending' ? 'Waiting for approval' : 'Not yet dispatched'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Request Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <h2 className="text-2xl font-bold mb-2">Create Alert Requirement</h2>
            <p className="text-gray-500 mb-6">For {selectedItem.name} from {selectedItem.vendor.name}</p>
            
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Requirement (e.g., Immediate pickup for shelter)</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-gray-800"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Needed ({selectedItem.unit})</label>
                <input 
                  type="number" 
                  max={selectedItem.quantity}
                  min="1"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-gray-800"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Bell size={20} />
                  <span style={{color: 'Black'}}>Send Alert</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NGODashboard;

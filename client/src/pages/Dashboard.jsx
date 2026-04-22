import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Calendar, Package } from 'lucide-react';
import * as inventoryService from '../services/inventoryService';
import DriverSimulator from '../components/DriverSimulator';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringSoon: 0,
    donatedItems: 0,
    wasteReduction: '0%'
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchData, setDispatchData] = useState({ id: '', tracking: '' });
  const [driverData, setDriverData] = useState({ name: '', phone: '', email: '' });
  const [activeSimulator, setActiveSimulator] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventory, statsData, reqData] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getInventoryStats(),
        inventoryService.getRequests()
      ]);
      
      const total = inventory.length;
      const expiring = inventory.filter(item => item.status === 'Expiring Soon').length;
      const donated = reqData.filter(req => req.status === 'delivered').length;
      const expired = inventory.filter(item => item.status === 'Expired').length;
      
      const totalOutdated = donated + expired;
      const reduction = totalOutdated > 0 ? Math.round((donated / totalOutdated) * 100) : 0;

      setStats({
        totalItems: total,
        expiringSoon: expiring,
        donatedItems: donated,
        wasteReduction: `${reduction}%`
      });

      setCategoryStats(statsData);
      setRequests(reqData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await inventoryService.updateRequestStatus(id, { status: 'approved' });
      fetchData();
    } catch (err) {
      alert('Failed to approve request');
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      // 1. Update Request Status to Dispatched
      await inventoryService.updateRequestStatus(dispatchData.id, { 
        status: 'dispatched',
        trackingDetails: dispatchData.tracking 
      });

      // 2. Create Tracking Session (Modular Extension)
      const session = await inventoryService.createTrackingSession({
        requestId: dispatchData.id,
        driverName: driverData.name,
        driverPhone: driverData.phone,
        driverEmail: driverData.email
      });

      // 3. Auto-start simulation for the dispatched order
      setActiveSimulator(dispatchData.id);

      setDispatchData({ id: '', tracking: '' });
      setDriverData({ name: '', phone: '', email: '' });
      fetchData();
    } catch (err) {
      alert('Failed to dispatch order and assign driver');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard stats...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-500">Track your inventory and environmental impact</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 w-fit">
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Driver Simulator Section */}
      {activeSimulator && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DriverSimulator requestId={activeSimulator} />
            <button 
              onClick={() => setActiveSimulator(null)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-bold flex items-center space-x-1"
            >
              <span>Stop Simulating</span>
            </button>
          </div>
          <div className="lg:col-span-2 bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <h3 className="text-blue-800 font-bold mb-2 flex items-center space-x-2">
              <Package size={18} />
              <span>Simulation Mode Active</span>
            </h3>
            <p className="text-sm text-blue-600 leading-relaxed">
              You are now simulating the Delivery Boy's mobile app. This streams real-time GPS coordinates 
              to the NGO's live map. Open the NGO Dashboard in another window to see the Cityflo-style 
              smooth marker movement and proximity alerts.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inventory" value={stats.totalItems} icon={<BarChart3 />} color="blue" />
        <StatCard title="Expiring Soon" value={stats.expiringSoon} icon={<AlertTriangle />} color="amber" />
        <StatCard title="Donated to NGOs" value={stats.donatedItems} icon={<TrendingUp />} color="emerald" />
        <StatCard title="Waste Reduction" value={stats.wasteReduction} icon={<TrendingUp />} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-2">Waste Analysis</h3>
          <p className="text-sm text-gray-400 mb-6">Analyzing which food categories are expiring most (Data Science Insight)</p>
          <div className="space-y-6">
            {categoryStats.length > 0 ? categoryStats.map((stat) => {
              const wastePercentage = stat.count > 0 ? (stat.expiredCount / stat.count) * 100 : 0;
              return (
                <div key={stat._id} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">{stat._id}</span>
                    <span className="text-gray-500">{stat.expiredCount} expired / {stat.count} total</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${wastePercentage > 50 ? 'bg-red-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.max(wastePercentage, 5)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    {wastePercentage > 20 ? `Recommendation: Reduce ${stat._id} stock by ${Math.round(wastePercentage)}% next month.` : `Healthy stock levels for ${stat._id}.`}
                  </p>
                </div>
              );
            }) : <p className="text-center text-gray-500 py-10">No data yet. Add inventory to see analysis.</p>}
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-2">NGO Food Alerts & Requests</h3>
          <p className="text-sm text-gray-400 mb-6">Respond to NGO requirements and track dispatches</p>
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{req.inventoryItem?.name}</p>
                    <p className="text-xs text-gray-500">From: {req.ngo?.name} ({req.ngo?.email})</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 italic">"{req.requirement}"</p>
                
                <div className="flex space-x-2">
                  {req.status === 'pending' && (
                    <button 
                      onClick={() => handleApprove(req._id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                      Approve Request
                    </button>
                  )}
                  {req.status === 'approved' && (
                    <button 
                      onClick={() => setDispatchData({ id: req._id, tracking: '' })}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                      Prepare Dispatch
                    </button>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-10 text-gray-400 italic">
                No active NGO requests yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consolidated Dispatch & Driver Assignment Modal */}
      {dispatchData.id && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                <Package size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Dispatch & Assign</h2>
            </div>

            <form onSubmit={handleDispatch} className="space-y-6">
              {/* Order Tracking Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Order Details</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tracking ID / Notes</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., TRK-12345 or Local Van #4"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-gray-800 text-sm"
                    value={dispatchData.tracking}
                    onChange={(e) => setDispatchData({...dispatchData, tracking: e.target.value})}
                  />
                </div>
              </div>

              {/* Driver Details */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Driver Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Driver Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-gray-800 text-sm"
                      value={driverData.name}
                      onChange={(e) => setDriverData({...driverData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+91..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-gray-800 text-sm"
                        value={driverData.phone}
                        onChange={(e) => setDriverData({...driverData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email ID</label>
                      <input 
                        type="email" 
                        required
                        placeholder="driver@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-gray-50 text-gray-800 text-sm"
                        value={driverData.email}
                        onChange={(e) => setDriverData({...driverData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setDispatchData({ id: '', tracking: '' })}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/20 text-sm"
                  style={{ color: 'black' }}
                >
                  Confirm & Notify Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    primary: "bg-green-50 text-primary border-green-100"
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4`}>
      <div className={`p-3 rounded-lg ${colors[color] || colors.primary}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldAlert, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center text-center space-y-12 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl"
      >
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
          Reducing Food Waste, <span className="text-primary">Feeding Communities.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          EcoBite helps local vendors track inventory and automatically redistributes surplus food to those in need or at a discount to consumers.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/inventory" className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-lg">
            <span style={{color: 'Black'}}  >Manage Inventory</span>
            <ArrowRight size={20} />
          </Link>
          <Link to="/dashboard" className="bg-white border-2 border-primary text-primary hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-all">
            View Dashboard
          </Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full text-primary mb-4">
            <Leaf size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Smart Inventory</h3>
          <p className="text-gray-500">Track shelf life and expiration dates automatically for all your perishable items.</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="bg-amber-100 p-3 rounded-full text-accent mb-4">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Auto Discounts</h3>
          <p className="text-gray-500">Near-expiry items are automatically listed at heavy discounts for local consumers.</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="bg-blue-100 p-3 rounded-full text-blue-500 mb-4">
            <HeartHandshake size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">NGO Alerts</h3>
          <p className="text-gray-500">Instant alerts sent to partnered NGOs for immediate donation pickup of surplus food.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

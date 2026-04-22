import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Navigation, Play, Square, MapPin } from 'lucide-react';

const DriverSimulator = ({ requestId }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPos, setCurrentPos] = useState({ lat: 19.0176, lng: 72.8561 }); // Starting point (Dadar)
  const socketRef = useRef();
  const timerRef = useRef();

  // Target: NGO Location (approx Dharavi/Bandra)
  const target = { lat: 19.0760, lng: 72.8777 };

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    return () => {
      socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startStreaming = () => {
    setIsStreaming(true);
    
    // Simulate movement towards target
    timerRef.current = setInterval(() => {
      setCurrentPos(prev => {
        const newLat = prev.lat + (target.lat - prev.lat) * 0.05;
        const newLng = prev.lng + (target.lng - prev.lng) * 0.05;
        
        const newPos = { 
          requestId, 
          lat: newLat, 
          lng: newLng, 
          status: 'En Route (Live)' 
        };
        
        socketRef.current.emit('update-location', newPos);
        return { lat: newLat, lng: newLng };
      });
    }, 3000); // Update every 3 seconds for smoother demo
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-2xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-lg">
            <Navigation size={20} className={isStreaming ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Driver App Simulator</h3>
            <p className="text-[10px] text-gray-400">Background GPS Streaming</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isStreaming ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
          {isStreaming ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between text-[10px] text-gray-400 mb-2">
            <span>Latitude</span>
            <span>Longitude</span>
          </div>
          <div className="flex justify-between font-mono text-sm text-primary">
            <span>{currentPos.lat.toFixed(6)}</span>
            <span>{currentPos.lng.toFixed(6)}</span>
          </div>
        </div>

        {!isStreaming ? (
          <button 
            onClick={startStreaming}
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
          >
            <Play size={18} fill="currentColor" />
            <span>Start Tracking</span>
          </button>
        ) : (
          <button 
            onClick={stopStreaming}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20"
          >
            <Square size={18} fill="currentColor" />
            <span>Stop Streaming</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverSimulator;

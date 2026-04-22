import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Navigation, ShieldCheck, MapPin, AlertCircle, StopCircle } from 'lucide-react';
import * as inventoryService from '../services/inventoryService';

const DriverTrackingPage = () => {
  const { sessionId } = useParams();
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const socketRef = useRef();
  const watchIdRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    // Listen for remote termination from NGO
    socketRef.current.on('session-terminated', () => {
      stopTracking();
      setStatus('Session Terminated by NGO');
    });

    return () => {
      stopTracking();
      socketRef.current.disconnect();
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setStatus('Streaming Location...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude });

        try {
          // Stream to REST API (for isolation/database)
          await inventoryService.updateDriverLocation(sessionId, {
            lat: latitude,
            lng: longitude
          });
        } catch (err) {
          console.error("Location sync failed", err);
        }
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setStatus('Tracking Stopped');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-primary p-8 text-white text-center">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
            <Navigation size={48} className={isTracking ? 'animate-pulse' : ''} />
          </div>
          <h1 className="text-2xl font-bold">Driver Tracking</h1>
          <p className="text-white/80 text-sm mt-2">EcoBite Secure Delivery Link</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <ShieldCheck className={isTracking ? 'text-primary' : 'text-gray-400'} />
              <span className="font-bold text-gray-700 text-sm">{status}</span>
            </div>
            {isTracking && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-4 text-gray-500">
              <MapPin size={20} className="text-primary" />
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Current Coordinates</p>
                <p className="font-mono text-sm">
                  {currentPos ? `${currentPos.lat.toFixed(6)}, ${currentPos.lng.toFixed(6)}` : 'Waiting for GPS...'}
                </p>
              </div>
            </div>
          </div>

          {!isTracking ? (
            <button 
              onClick={startTracking}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2"
            >
              <Navigation size={20} fill="currentColor" />
              <span>Start Delivery Session</span>
            </button>
          ) : (
            <button 
              onClick={stopTracking}
              className="w-full bg-gray-800 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2"
            >
              <StopCircle size={20} />
              <span>Stop Tracking</span>
            </button>
          )}

          <p className="text-[10px] text-center text-gray-400 px-4 leading-relaxed">
            By starting the session, you agree to share your real-time location with the recipient NGO. 
            Tracking will automatically stop once the order is marked as received.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverTrackingPage;

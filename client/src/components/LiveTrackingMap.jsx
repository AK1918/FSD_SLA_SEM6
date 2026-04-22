import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { Truck, MapPin, Bell, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Truck Icon for Delivery Boy
const truckIcon = new L.DivIcon({
  html: `<div class="bg-primary p-2 rounded-full shadow-lg border-2 border-white text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
         </div>`,
  className: 'custom-div-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

// Component to handle map centering and smooth animation
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const LiveTrackingMap = ({ requestId }) => {
  const [driverPos, setDriverPos] = useState(null);
  const [interpolatedPos, setInterpolatedPos] = useState(null);
  const [status, setStatus] = useState('Waiting for Driver...');
  const [proximityAlert, setProximityAlert] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  
  const socketRef = useRef();
  const animationRef = useRef();

  // NGO Hub Location (Default)
  const ngoLocation = [19.0760, 72.8777]; // Mumbai

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join-tracking', requestId);

    socketRef.current.on('location-receive', (data) => {
      if (isTerminated) return;

      const newPos = [data.lat, data.lng];
      
      if (!driverPos) {
        setDriverPos(newPos);
        setInterpolatedPos(newPos);
      } else {
        animateMarker(driverPos, newPos);
        setDriverPos(newPos);
      }

      setStatus(data.status || 'Driver En Route');

      // Geofencing: Proximity Alerts
      const distance = L.latLng(data.lat, data.lng).distanceTo(L.latLng(ngoLocation));
      if (distance < 500) { 
        setProximityAlert(true);
      } else {
        setProximityAlert(false);
      }
    });

    socketRef.current.on('session-terminated', () => {
      setIsTerminated(true);
      setStatus('Tracking Terminated (Privacy Protected)');
      setInterpolatedPos(null);
    });

    return () => {
      socketRef.current.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [requestId, isTerminated, driverPos]);

  // Cityflo-Style smooth movement (Interpolation)
  const animateMarker = (start, end) => {
    const startTime = performance.now();
    const duration = 5000; 

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const lat = start[0] + (end[0] - start[0]) * progress;
      const lng = start[1] + (end[1] - start[1]) * progress;

      setInterpolatedPos([lat, lng]);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
      {/* Live Status Overlay (Cityflo Style) */}
      <div className="absolute top-6 left-6 z-[1000] space-y-3">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 min-w-[220px]">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${isTerminated ? 'bg-red-500' : 'bg-primary animate-ping'}`}></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Status</p>
              <p className="text-sm font-bold text-gray-800">{status}</p>
            </div>
          </div>
          {proximityAlert && !isTerminated && (
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="mt-3 flex items-center space-x-2 text-primary bg-primary/10 p-2 rounded-xl border border-primary/20"
            >
              <Bell size={16} className="animate-bounce" />
              <span className="text-[11px] font-black uppercase">Near Delivery Point</span>
            </motion.div>
          )}
        </div>
      </div>

      {isTerminated && (
        <div className="absolute inset-0 z-[1001] bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center text-center p-8">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs">
            <div className="mx-auto text-primary mb-4">
              <ShieldCheck size={48} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Privacy Secured</h3>
            <p className="text-sm text-gray-500">The tracking session has ended and live data has been deleted.</p>
          </div>
        </div>
      )}

      <MapContainer 
        center={ngoLocation} 
        zoom={14} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* NGO Hub */}
        <Marker position={ngoLocation}>
          <Popup className="font-bold">Your Location</Popup>
        </Marker>

        {/* Animated Driver Marker */}
        {interpolatedPos && !isTerminated && (
          <>
            <Marker position={interpolatedPos} icon={truckIcon}>
              <Popup>Delivery Boy</Popup>
            </Marker>
            <MapUpdater center={interpolatedPos} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, Clock, MapPin, Coffee, Camera, 
  SkipForward, AlertTriangle, CheckCircle, MoreHorizontal,
  Users, Music, Heart, Share2, Compass
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useMoodMap } from '../state/store.js';
import { getTripState, advanceTrip, reportCrowd, startTrip } from '../lib/trip.js';
import { haversineKm } from '../utils/geo.js';

// Custom Map Component to handle updates
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

// Custom Marker Icons
const createIcon = (color, size = 30) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
  popupAnchor: [0, -size / 2]
});

const userIcon = new L.DivIcon({
  className: 'user-location-pulse',
  html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function LiveTrip() {
  const { id } = useParams();
  const nav = useNavigate();
  const user = useMoodMap(s => s.user);
  const [state, setState] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const visitedRef = useRef(new Set());
  const autoAdvanceRef = useRef(false);
  
  // Load trip state
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const s = await getTripState(id);
        if (mounted) setState(s);
      } catch (e) {
        console.error("Failed to load trip state", e);
        try {
          const itinerary = await fetchItineraryById(id);
          if (itinerary?.id) {
            const started = await startTrip(itinerary.id, null);
            if (mounted) setState(started);
          }
        } catch (startErr) {
          console.error("Neither trip nor itinerary found for id:", id, startErr);
        }
      }
    }
    load();
    
    // Poll for updates every 30s
    const poller = setInterval(load, 30000);
    
    // Watch location
    const watch = navigator.geolocation.watchPosition(
      p => setUserPos([p.coords.latitude, p.coords.longitude]),
      e => console.error(e),
      { enableHighAccuracy: true }
    );
    
    return () => {
      clearInterval(poller);
      navigator.geolocation.clearWatch(watch);
    };
  }, [id]);

  // Actions
  async function handleAction(action) {
    setBusy(true);
    try {
      const newState = await advanceTrip(id, action);
      setState(newState);
      if (action === 'end') nav(`/trip/${id}/complete`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
      setIsMenuOpen(false);
    }
  }

  // Derived state
  const currentStop = state?.current;
  const nextStop = state?.next;
  const allStops = state?.all || [];
  
  const progress = useMemo(() => {
    if (!state?.trip) return 0;
    const total = allStops.length;
    const current = state.trip.currentIndex || 0;
    return (current / total) * 100;
  }, [state, allStops]);

  // Auto-check-in when user reaches current stop
  useEffect(() => {
    if (!userPos || !currentStop || !state?.trip) return;
    const d = haversineKm(userPos[0], userPos[1], currentStop.lat, currentStop.lng);
    const currentOrder = currentStop.order;
    if (d < 0.08 && !visitedRef.current.has(currentOrder) && !autoAdvanceRef.current) { // ~80m
      autoAdvanceRef.current = true;
      (async () => {
        try {
          if (user?.id) {
            await axios.post('/api/user/places', {
              userId: user.id,
              name: currentStop.name,
              lat: currentStop.lat,
              lng: currentStop.lng,
              category: currentStop.category,
              rating: currentStop.rating,
              reviews: currentStop.reviews,
              tags: ['visited', state.trip.id],
              notes: `Visited during ${new Date().toLocaleDateString()} trip`
            });
          }
        } catch (e) {
          console.error('Failed to save visited place', e);
        } finally {
          visitedRef.current.add(currentOrder);
          await handleAction('checkout');
          autoAdvanceRef.current = false;
        }
      })();
    }
  }, [userPos, currentStop, state?.trip, user]);

  function buildGoogleMapsRouteLink() {
    if (!allStops.length) return '#';
    const start = userPos ? `${userPos[0]},${userPos[1]}` : `${allStops[0].lat},${allStops[0].lng}`;
    const remainingStops = allStops.slice((state?.trip?.currentIndex || 1) - 1);
    const destination = remainingStops[remainingStops.length - 1];
    const waypoints = remainingStops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join('|');
    const params = new URLSearchParams({
      api: '1',
      origin: start,
      destination: `${destination.lat},${destination.lng}`,
      travelmode: 'walking',
      waypoints
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const mapCenter = useMemo(() => {
    if (currentStop) return [currentStop.lat, currentStop.lng];
    if (allStops[0]) return [allStops[0].lat, allStops[0].lng];
    return [12.9716, 77.5946];
  }, [currentStop, allStops]);

  if (!state) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-500 font-medium">Loading your vibe...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full relative bg-slate-100 overflow-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-4 bg-gradient-to-b from-white/90 to-transparent pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <button onClick={() => nav(-1)} className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all">
            <Compass size={20} className="text-slate-700" />
          </button>
          <div className="px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white/50">
            <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              LIVE TRIP • {Math.round(progress)}%
            </span>
          </div>
          <a 
            href={buildGoogleMapsRouteLink()} 
            target="_blank" 
            rel="noreferrer" 
            className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all"
            title="Open route in Google Maps"
          >
            <Share2 size={20} className="text-slate-700" />
          </a>
        </div>
      </div>

      {/* Map Layer */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={15} 
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapUpdater center={mapCenter} />
          
          {/* Route Line */}
          <Polyline 
            positions={allStops.map(s => [s.lat, s.lng])}
            pathOptions={{ color: '#6366f1', weight: 4, opacity: 0.6, dashArray: '10, 10' }} 
          />

          {/* Stops */}
          {allStops.map((stop, idx) => {
            const isCurrent = currentStop?.order === stop.order;
            const isPast = idx < (state.trip.currentIndex || 0);
            return (
              <Marker 
                key={stop.order} 
                position={[stop.lat, stop.lng]}
                icon={createIcon(isCurrent ? '#6366f1' : isPast ? '#94a3b8' : '#fbbf24', isCurrent ? 24 : 16)}
              >
                {isCurrent && (
                  <Popup className="custom-popup" offset={[0, -10]} closeButton={false}>
                    <div className="text-center">
                      <div className="font-bold text-sm">{stop.name}</div>
                      <div className="text-xs text-slate-500">You are here! ✨</div>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          {/* User Location */}
          {userPos && <Marker position={userPos} icon={userIcon} />}
        </MapContainer>
      </div>

      {/* Bottom Sheet Interface */}
      <div className="relative z-[500] -mt-6 bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-100 flex flex-col max-h-[50vh]">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Current Stop Info */}
        <div className="px-6 py-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Current Stop
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} /> {currentStop?.arrivalTime || '--:--'} - {currentStop?.departureTime || '--:--'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {currentStop?.name || "Trip Ended"}
              </h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                <MapPin size={12} /> {currentStop?.category || "Destination"}
              </p>
            </div>
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStop?.lat},${currentStop?.lng}`)}
              className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
            >
              <Navigation size={24} />
            </button>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <button onClick={() => handleAction('checkout')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-active:scale-90 transition-all border border-green-100">
                <CheckCircle size={20} />
              </div>
              <span className="text-[10px] font-medium text-slate-600">Check In</span>
            </button>
            <button onClick={() => handleAction('add30')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-active:scale-90 transition-all border border-orange-100">
                <Clock size={20} />
              </div>
              <span className="text-[10px] font-medium text-slate-600">+30m</span>
            </button>
            <button onClick={() => reportCrowd(id, state.trip.currentIndex, 'High')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-active:scale-90 transition-all border border-pink-100">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-medium text-slate-600">Crowded</span>
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-active:scale-90 transition-all border border-slate-100">
                <MoreHorizontal size={20} />
              </div>
              <span className="text-[10px] font-medium text-slate-600">More</span>
            </button>
          </div>
        </div>

        {/* Up Next Preview */}
        {nextStop && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Up Next</span>
              <span className="text-xs font-medium text-indigo-600">
                {userPos ? `${Math.round(haversineKm(userPos[0], userPos[1], nextStop.lat, nextStop.lng) * 10) / 10}km away` : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm">
                {nextStop.order}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">{nextStop.name}</div>
                <div className="text-xs text-slate-500">{nextStop.category}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[900]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-[1000] p-6 pb-10"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-4">Trip Options</h3>
              <div className="space-y-3">
                <button onClick={() => handleAction('skip')} className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center gap-3 font-medium text-slate-700 transition-colors">
                  <SkipForward size={20} /> Skip current stop
                </button>
                <button onClick={() => handleAction('pause')} className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center gap-3 font-medium text-slate-700 transition-colors">
                  <Coffee size={20} /> Pause trip
                </button>
                <div className="h-px bg-slate-100 my-2" />
                <button onClick={() => handleAction('end')} className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 flex items-center gap-3 font-medium text-red-600 transition-colors">
                  <AlertTriangle size={20} /> End Trip Early
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

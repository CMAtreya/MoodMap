import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { fetchItineraryById } from '../lib/fetch.js';
import { startTrip } from '../lib/trip.js';
import { haversineKm } from '../utils/geo.js';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, Navigation, Share2, Bookmark } from 'lucide-react';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ItineraryResult() {
  const { id } = useParams();
  const nav = useNavigate();
  const it = useMoodMap(s => s.itinerary);
  const setItinerary = useMoodMap(s => s.setItinerary);
  const user = useMoodMap(s => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pos, setPos] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!it || it.id !== id) {
        setLoading(true);
        try {
          const data = await fetchItineraryById(id);
          if (!mounted) return;
          setItinerary(data);
        } catch (e) {
          setError('Itinerary not found');
        } finally {
          setLoading(false);
        }
      }
    }
    run();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    const watch = navigator.geolocation.watchPosition(p => setPos(p.coords));
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  if (!it || it.id !== id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-xl font-medium text-slate-600">{loading ? 'Loading itinerary...' : error || 'Itinerary not found'}</div>
          {!loading && <button onClick={() => nav('/')} className="mt-4 apple-btn-primary">Return Home</button>}
        </div>
      </div>
    );
  }
  const positions = it.stops.map(s => [s.lat, s.lng]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-2 gap-8"
      >
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-[2rem]">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">{it.mood}</span>
              <span className="text-sm text-gray-500">{it.summary.totalDurationMinutes} min • {it.summary.totalDistanceKm} km</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">{it.narrative}</h1>
            {Array.isArray(it.tips) && it.tips.length > 0 && (
              <div className="space-y-1">
                {it.tips.map((t, i) => (<div key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-blue-500">•</span> {t}
                </div>))}
              </div>
            )}
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={async () => {
                  const trip = await startTrip(it.id, user?.id || undefined);
                  const tripId = trip?.trip?.id || trip?.id;
                  if (tripId) {
                    nav(`/trip/${tripId}/live`);
                  }
                }}
                className="flex-1 apple-btn-primary flex items-center justify-center gap-2"
              >
                <Navigation size={18} /> Start Trip
              </button>
              <button className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-slate-700">
                <Bookmark size={20} />
              </button>
              <button className="glass-button w-12 h-12 rounded-xl flex items-center justify-center text-slate-700">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold px-2">Your Route</h2>
            {it.stops.map((s, i) => (
              <motion.div 
                key={s.order} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-5 rounded-2xl flex items-start gap-4 group hover:bg-white/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                  {s.order}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">{s.name}</h3>
                      <div className="text-sm text-slate-500">{s.category}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {s.rating && (
                        <div className="flex items-center gap-1 text-amber-500 font-medium text-sm">
                          <Star size={14} fill="currentColor" /> {s.rating}
                        </div>
                      )}
                      {s.reviews && <div className="text-xs text-slate-400">({s.reviews} reviews)</div>}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {s.arrivalTime} - {s.departureTime}
                    </div>
                    {pos && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {Math.round(haversineKm(pos.latitude, pos.longitude, s.lat, s.lng) * 10) / 10} km away
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-400">
                    Stay: {s.durationMinutes}m • Travel: {s.travelMinutes}m
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {it.alternatives && it.alternatives.length > 0 && (
            <div className="mt-8">
              <div className="font-semibold mb-4 text-gray-800">You might also like</div>
              <div className="space-y-3">
                {it.alternatives.map(a => (
                  <div key={a.placeId} className="p-4 rounded-lg border border-dashed bg-gray-50/50">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="font-medium text-gray-700">{a.name}</div>
                         <div className="text-sm text-gray-500">{a.category}</div>
                       </div>
                       <div className="text-xs font-medium px-2 py-1 bg-white rounded border">
                         ★ {a.rating || '-'}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:h-[calc(100vh-8rem)] sticky top-24">
          <div className="h-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 ring-1 ring-black/5 relative">
             <MapContainer center={[it.stops[0].lat, it.stops[0].lng]} zoom={13} className="h-full w-full">
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {it.stops.map(s => (
                <Marker key={s.order} position={[s.lat, s.lng]} icon={icon} />
              ))}
              <Polyline positions={positions} color="#3b82f6" weight={4} opacity={0.7} />
            </MapContainer>
            
            {/* Map Overlay Controls */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-2 pointer-events-none">
               <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg pointer-events-auto text-xs font-medium text-slate-600">
                  {it.stops.length} Stops • {it.summary.totalDistanceKm} km Total
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

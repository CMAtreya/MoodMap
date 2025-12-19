import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { startTrip } from '../lib/trip.js';
import { Share2, CloudSun, DollarSign, ListChecks, ArrowLeft, Play } from 'lucide-react';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ItineraryFinal() {
  const nav = useNavigate();
  const it = useMoodMap(s => s.itinerary);
  const user = useMoodMap(s => s.user);
  const [starting, setStarting] = React.useState(false);

  if (!it) {
    nav('/');
    return null;
  }

  const positions = it.stops.map(s => [s.lat, s.lng]);
  const moodColors = {
    "Energetic": "bg-orange-100 text-orange-800",
    "Relaxed": "bg-teal-100 text-teal-800",
    "Romantic": "bg-pink-100 text-pink-800",
    "Curious": "bg-purple-100 text-purple-800",
    "Social": "bg-blue-100 text-blue-800",
    "Nature": "bg-green-100 text-green-800",
    "Family Fun": "bg-yellow-100 text-yellow-800"
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b px-6 py-8 md:py-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your Journey is Ready!</h1>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-medium text-sm ${moodColors[it.mood] || 'bg-gray-100'}`}>
          {it.mood} Adventure
        </div>
        <div className="mt-4 text-slate-500 max-w-lg mx-auto">
          {it.narrative}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid md:grid-cols-3 gap-8">
        
        {/* Left: Details & Packing */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CloudSun size={20} className="text-blue-500" /> Weather & Vibe
            </h2>
            <div className="text-slate-600 text-sm">
              Current forecast suggests clear skies. Perfect for your {it.mood.toLowerCase()} walk!
            </div>
            <div className="mt-4 flex gap-4">
               <div className="text-center bg-blue-50 p-3 rounded-lg flex-1">
                 <div className="text-xl font-bold text-blue-700">72°F</div>
                 <div className="text-xs text-blue-500">Temp</div>
               </div>
               <div className="text-center bg-orange-50 p-3 rounded-lg flex-1">
                 <div className="text-xl font-bold text-orange-700">Low</div>
                 <div className="text-xs text-orange-500">Rain Chance</div>
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ListChecks size={20} className="text-green-500" /> Packing List
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><input type="checkbox" className="rounded text-blue-600" /> Comfortable walking shoes</li>
              <li className="flex items-center gap-2"><input type="checkbox" className="rounded text-blue-600" /> Portable charger</li>
              <li className="flex items-center gap-2"><input type="checkbox" className="rounded text-blue-600" /> Water bottle</li>
              {it.mood === 'Romantic' && <li className="flex items-center gap-2"><input type="checkbox" className="rounded text-blue-600" /> Camera</li>}
              {it.mood === 'Nature' && <li className="flex items-center gap-2"><input type="checkbox" className="rounded text-blue-600" /> Sunscreen</li>}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" /> Estimated Cost
            </h2>
            <div className="text-3xl font-bold text-slate-900">$45 - $80</div>
            <div className="text-xs text-slate-400 mt-1">Per person (excluding shopping)</div>
          </div>
        </div>

        {/* Center: Itinerary List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border h-fit">
          <h2 className="font-semibold text-lg mb-6">Itinerary Timeline</h2>
          <div className="space-y-6 relative">
             <div className="absolute top-2 bottom-2 left-[15px] w-0.5 bg-slate-100" />
             {it.stops.map((s, i) => (
               <div key={i} className="relative flex gap-4">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 shrink-0 ${s.category === 'Food' ? 'bg-orange-500' : 'bg-purple-500'}`}>
                   {i + 1}
                 </div>
                 <div>
                   <div className="font-medium text-slate-900">{s.name}</div>
                   <div className="text-xs text-slate-500 mb-1">{s.category}</div>
                   <div className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs font-mono text-slate-600">
                     {s.arrivalTime} - {s.departureTime}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right: Map */}
        <div className="h-[400px] md:h-auto md:min-h-[500px] bg-slate-200 rounded-2xl overflow-hidden border shadow-sm relative">
           <MapContainer center={[it.stops[0].lat, it.stops[0].lng]} zoom={14} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {it.stops.map((s, i) => (
                <Marker key={i} position={[s.lat, s.lng]} icon={icon} />
              ))}
              <Polyline positions={positions} color="#4f46e5" weight={4} opacity={0.7} />
           </MapContainer>
           <div className="absolute bottom-4 right-4 z-[400]">
             <button className="bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 transition-colors">
               <Share2 size={20} className="text-slate-700" />
             </button>
           </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-4">
          <button onClick={() => nav('/builder')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium px-4 py-2 bg-blue-50 rounded-lg">
            <ListChecks size={18} /> Edit Itinerary
          </button>
          <button onClick={() => nav('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium px-4 py-2">
            <ArrowLeft size={18} /> Start New
          </button>
        </div>
        
        <button 
          onClick={async () => {
            if (starting) return;
            setStarting(true);
            try {
              const trip = await startTrip(it.id, user?.id || undefined);
              const tripId = trip?.trip?.id || trip?.id;
              if (tripId) {
                nav(`/trip/${tripId}/live`);
              }
            } catch (e) {
              console.error(e);
              alert('Failed to start trip. Please try again.');
            } finally {
              setStarting(false);
            }
          }}
          className="apple-btn-primary flex items-center gap-2 px-8 py-3 text-lg shadow-lg shadow-blue-500/20"
          disabled={starting}
        >
          {starting ? 'Starting...' : (
            <>
              <Play size={20} fill="currentColor" /> Start Adventure
            </>
          )}
        </button>
      </div>
    </div>
  );
}

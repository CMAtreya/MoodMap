import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { updateItinerary, generateItinerary } from '../lib/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Coffee, Utensils, Clock, ArrowRight, Check, Navigation, Star, RefreshCw } from 'lucide-react';
import { haversineKm } from '../utils/geo.js';

export default function ItineraryBuilder() {
  const nav = useNavigate();
  const itinerary = useMoodMap(s => s.itinerary);
  const setItinerary = useMoodMap(s => s.setItinerary);
  const user = useMoodMap(s => s.user);
  const preferences = useMoodMap(s => s.preferences);
  
  // Local state for the builder
  const [myStops, setMyStops] = useState([]);
  const [pool, setPool] = useState({ attractions: [], food: [] });
  const [currentTime, setCurrentTime] = useState(0); // timestamp
  const [currentLoc, setCurrentLoc] = useState(null); // {lat, lng}
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [foodFilter, setFoodFilter] = useState('All'); // 'All', 'Italian', 'Chinese', 'South Indian', etc.
  const [mealFilter, setMealFilter] = useState('All'); // 'All', 'Breakfast', 'Lunch', 'Dinner'

  useEffect(() => {
    if (!itinerary) {
      nav('/');
      return;
    }
    
    // Initialize pool from itinerary data
    // If backend doesn't return pool (old version), fallback to empty
    setPool(itinerary.pool || { attractions: [], food: [] });
    
    // Initialize time/loc
    setCurrentTime(itinerary.start.timestamp);
    setCurrentLoc({ lat: itinerary.start.lat, lng: itinerary.start.lng });
  }, [itinerary, nav]);

  // Helper to format time
  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add a place to the itinerary
  const addPlace = (place) => {
    const lastLoc = currentLoc;
    const distKm = haversineKm(lastLoc.lat, lastLoc.lng, place.lat, place.lng);
    const travelMins = Math.ceil((distKm / 5) * 60); // Walking speed approx
    
    // Arrival is current time + travel
    const arrivalTs = currentTime + (travelMins * 60 * 1000);
    // Duration depends on category
    const durationMins = place.category === 'Food' ? 60 : 90;
    const departureTs = arrivalTs + (durationMins * 60 * 1000);

    const newStop = {
      ...place,
      order: myStops.length + 1,
      arrivalTime: formatTime(arrivalTs),
      departureTime: formatTime(departureTs),
      travelMinutes: travelMins,
      durationMinutes: durationMins,
      rawArrival: arrivalTs,
      rawDeparture: departureTs
    };

    setMyStops([...myStops, newStop]);
    setCurrentTime(departureTs);
    setCurrentLoc({ lat: place.lat, lng: place.lng });

    // Remove from pool
    setPool(prev => ({
      attractions: prev.attractions.filter(p => p.placeId !== place.placeId),
      food: prev.food.filter(p => p.placeId !== place.placeId)
    }));
  };

  // Helper functions for categorization and filtering
  const getPlaceHours = (place) => {
    const c = ((place.category || '') + ' ' + (place.categories || []).join(' ')).toLowerCase();
    if (c.includes('museum') || c.includes('gallery')) return { open: 10, close: 18 };
    if (c.includes('park') || c.includes('nature') || c.includes('garden')) return { open: 6, close: 19 };
    if (c.includes('temple') || c.includes('church') || c.includes('worship')) return { open: 7, close: 20 };
    if (c.includes('night') || c.includes('bar') || c.includes('pub') || c.includes('club')) return { open: 18, close: 26 }; 
    if (c.includes('shop') || c.includes('mall')) return { open: 10, close: 22 };
    if (c.includes('viewpoint') || c.includes('scenic')) return { open: 6, close: 18 };
    return { open: 9, close: 21 }; 
  };

  const isPlaceOpen = (place, timestamp) => {
    if (!timestamp) return true;
    const date = new Date(timestamp);
    const h = date.getHours();
    const { open, close } = getPlaceHours(place);
    
    if (close > 24) { // Late night places
        if (h >= open) return true;
        if (h < (close - 24)) return true;
        return false;
    }
    return h >= open && h < close;
  };

  const getMealType = (place) => {
    const c = ((place.category || '') + ' ' + (place.categories || []).join(' ')).toLowerCase();
    const types = new Set();
    if (c.includes('cafe') || c.includes('bakery') || c.includes('coffee') || c.includes('breakfast')) types.add('Breakfast');
    if (c.includes('diner') || c.includes('bistro') || c.includes('burger') || c.includes('pizza') || c.includes('fast food')) types.add('Lunch');
    if (c.includes('fine dining') || c.includes('steak') || c.includes('bar') || c.includes('pub') || c.includes('grill')) types.add('Dinner');
    if (c.includes('restaurant') || c.includes('food') || c.includes('kitchen')) { types.add('Lunch'); types.add('Dinner'); }
    if (types.size === 0) { types.add('Lunch'); types.add('Dinner'); }
    return types;
  };

  // Sort candidates by reviews (primary) and distance (secondary)
  const getSorted = (list, type) => {
    let filtered = list;

    // Filter Food by Meal Type & Cuisine
    if (type === 'food') {
      filtered = filtered.filter(p => {
        // Meal Type Filter
        if (mealFilter !== 'All') {
          const types = getMealType(p);
          if (!types.has(mealFilter)) return false;
        }
        // Cuisine Filter
        if (foodFilter !== 'All') {
          const cats = (p.categories || []).join(' ').toLowerCase();
          const name = p.name.toLowerCase();
          const f = foodFilter.toLowerCase();
          return cats.includes(f) || name.includes(f);
        }
        // Preferences: Cuisines
        const selectedCuisines = (preferences?.cuisines || []);
        if (selectedCuisines.length > 0) {
          const cats = (p.categories || []).join(' ').toLowerCase();
          const name = p.name.toLowerCase();
          const keywords = selectedCuisines.map(id => {
            if (id === 'south_indian') return 'south indian';
            if (id === 'north_indian') return 'north indian';
            if (id === 'italian') return 'italian';
            if (id === 'chinese') return 'chinese';
            if (id === 'authentic') return 'authentic';
            if (id === 'continental') return 'continental';
            return id.replace(/_/g, ' ').toLowerCase();
          });
          const matchCuisine = keywords.some(k => cats.includes(k) || name.includes(k));
          if (!matchCuisine) return false;
        }
        // Preferences: Dietary
        const dietary = String(preferences?.dietary || '').toLowerCase();
        if (dietary === 'veg') {
          const cats = (p.categories || []).join(' ').toLowerCase();
          const name = p.name.toLowerCase();
          const isVeg = cats.includes('veg') || cats.includes('vegetarian') || name.includes('veg') || name.includes('vegetarian');
          if (!isVeg) return false;
        }
        return true;
      });
    }

    // Filter Attractions by Opening Hours (Dynamic Refresh)
    if (type === 'attraction') {
      filtered = filtered.filter(p => {
        if (!isPlaceOpen(p, currentTime)) return false;
        const heritage = Boolean(preferences?.heritageVibe);
        if (heritage) {
          const cats = (p.categories || []).join(' ').toLowerCase() + ' ' + String(p.category || '').toLowerCase() + ' ' + String(p.name || '').toLowerCase();
          const vibeMatch = ['historic', 'heritage', 'museum', 'temple', 'landmark', 'authentic'].some(k => cats.includes(k));
          if (!vibeMatch) return false;
        }
        return true;
      });
    }

    if (!currentLoc) return filtered;
    return [...filtered].sort((a, b) => {
      // Primary: Reviews (descending)
      const rA = a.reviews || 0;
      const rB = b.reviews || 0;
      if (Math.abs(rA - rB) > 100) return rB - rA; // Significant difference in reviews wins

      // Secondary: Distance (ascending)
      const dA = haversineKm(currentLoc.lat, currentLoc.lng, a.lat, a.lng);
      const dB = haversineKm(currentLoc.lat, currentLoc.lng, b.lat, b.lng);
      return dA - dB;
    });
  };

  // Helper to suggest meals
  const getMealSuggestion = (ts) => {
    const h = new Date(ts).getHours();
    if (h >= 11 && h <= 14) return 'Lunch';
    if (h >= 16 && h <= 17) return 'Snack';
    if (h >= 19 && h <= 21) return 'Dinner';
    return null;
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const coords = { latitude: itinerary.start.lat, longitude: itinerary.start.lng };
      const newData = await generateItinerary(
        itinerary.mood,
        itinerary.timeWindowHours,
        coords,
        user?.id,
        itinerary.start.timestamp,
        preferences,
        true // refresh
      );
      
      // Replace the pool with new suggestions instead of merging
      // This ensures the user sees a fresh list of ideas
      setPool(newData.pool);
    } catch (e) {
      console.error("Failed to refresh suggestions", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFinalize = async () => {
    if (saving) return;
    setSaving(true);
    // Update the global itinerary with our custom built one
    const updated = {
      ...itinerary,
      stops: myStops,
      summary: {
        ...itinerary.summary,
        stopCount: myStops.length,
        totalDurationMinutes: (currentTime - itinerary.start.timestamp) / 60000
      }
    };
    
    try {
      // Save to backend so Start Trip picks up the correct stops
      await updateItinerary({ ...updated, userId: user?.id });
      setItinerary(updated);
      nav('/itinerary-final');
    } catch (e) {
      console.error(e);
      // Even if save fails, we proceed locally, but warn?
      // For now, just proceed as user experience is key.
      setItinerary(updated);
      nav('/itinerary-final');
    } finally {
      setSaving(false);
    }
  };

  if (!itinerary) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Build Your Journey</h1>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Clock size={14} /> Start: {formatTime(itinerary.start.timestamp)}
            <span className="mx-1">•</span>
            {itinerary.mood} Mood
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-400">Current Time</div>
            <div className="font-mono font-medium text-blue-600">{formatTime(currentTime)}</div>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2.5 rounded-full font-medium hover:bg-slate-50 border border-slate-200 transition-all"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">More Ideas</span>
          </button>
          <button 
            onClick={handleFinalize}
            disabled={myStops.length === 0 || saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
          >
            {saving ? 'Saving...' : <>Finalize Trip <ArrowRight size={18} /></>}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        
        {/* Left: Attractions */}
        <div className="md:col-span-3 bg-white border-r overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4 sticky top-0 bg-white py-2 z-10">
            <MapPin size={18} className="text-purple-500" />
            Tourist Spots
            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-normal ml-auto">
              Open @ {formatTime(currentTime)}
            </span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {getSorted(pool.attractions).map(p => (
                <PlaceCard key={p.placeId} place={p} onAdd={() => addPlace(p)} type="attraction" currentLoc={currentLoc} />
              ))}
            </AnimatePresence>
            {pool.attractions.length === 0 && <EmptyState />}
          </div>
        </div>

        {/* Center: My Itinerary (Timeline) */}
        <div className="md:col-span-6 bg-slate-50/50 overflow-y-auto p-6 custom-scrollbar relative">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 font-semibold text-slate-700 mb-6 justify-center">
              <Navigation size={18} className="text-blue-500" />
              Your Path
            </div>

            {/* Start Node */}
            <div className="flex gap-4 mb-2">
               <div className="flex flex-col items-center">
                 <div className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-slate-100" />
                 <div className="w-0.5 flex-1 bg-slate-200 my-1" />
               </div>
               <div className="pb-8">
                 <div className="text-sm font-medium text-slate-500">Start Point</div>
                 <div className="text-xs text-slate-400">{formatTime(itinerary.start.timestamp)}</div>
               </div>
            </div>

            {/* Stops */}
            <AnimatePresence>
              {myStops.map((stop, i) => (
                <motion.div 
                  key={stop.placeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 group"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm z-10 ${stop.category === 'Food' ? 'bg-orange-500' : 'bg-purple-500'}`}>
                      {i + 1}
                    </div>
                    {i !== myStops.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-8 flex-1">
                    <div className="bg-white p-4 rounded-xl border shadow-sm group-hover:shadow-md transition-shadow relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-900">{stop.name}</h3>
                          <div className="text-sm text-slate-500">{stop.category}</div>
                          {(stop.description || stop.highlight) && (
                            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                              {stop.highlight && <div className="font-semibold text-slate-700 mb-0.5">✨ {stop.highlight}</div>}
                              {stop.description && <div>{stop.description}</div>}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {stop.arrivalTime} - {stop.departureTime}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Navigation size={12} /> {stop.travelMinutes} min travel</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {stop.durationMinutes} min stay</span>
                      </div>
                    </div>

                    {/* Meal Suggestion Gap */}
                    {i < myStops.length - 1 && (() => {
                      const nextStop = myStops[i + 1];
                      const gap = nextStop.rawArrival - stop.rawDeparture;
                      const meal = getMealSuggestion(stop.rawDeparture + gap / 2);
                      if (gap > 60 * 60 * 1000 && meal) {
                         return (
                           <div className="mt-4 flex items-center gap-2 text-orange-600 text-xs font-medium bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 border-dashed">
                             <Utensils size={12} />
                             Suggested Break: Time for {meal}?
                           </div>
                         );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State / Prompt */}
            {myStops.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <div className="text-slate-400 mb-2">Your journey is empty</div>
                <div className="text-sm text-slate-500">Pick a spot from the side columns to start!</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Food */}
        <div className="md:col-span-3 bg-white border-l overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4 sticky top-0 bg-white py-2 z-10">
            <Utensils size={18} className="text-orange-500" />
            Food & Drinks
          </div>
          
          {/* Meal Type Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-lg mb-3">
            {['All', 'Breakfast', 'Lunch', 'Dinner'].map(m => (
              <button
                key={m}
                onClick={() => setMealFilter(m)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mealFilter === m ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['All', 'Italian', 'Chinese', 'Indian', 'Authentic', 'Cafe', 'Veg'].map(f => (
              <button
                key={f}
                onClick={() => setFoodFilter(f)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  foodFilter === f 
                    ? 'bg-orange-100 border-orange-200 text-orange-800' 
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {getSorted(pool.food, 'food').map(p => (
                <PlaceCard key={p.placeId} place={p} onAdd={() => addPlace(p)} type="food" currentLoc={currentLoc} />
              ))}
            </AnimatePresence>
            {pool.food.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({ place, onAdd, type, currentLoc }) {
  const [hovered, setHovered] = useState(false);
  const waitTime = place.waitTimeMinutes || 0;
  const crowd = place.crowdLevel || 'Low';
  const isCrowded = crowd === 'High' || waitTime > 30;
  
  // Calculate travel time if currentLoc is available
  let travelText = '';
  if (currentLoc) {
    const dist = haversineKm(currentLoc.lat, currentLoc.lng, place.lat, place.lng);
    const mins = Math.ceil((dist / 5) * 60);
    travelText = `${mins}m away`;
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative"
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-slate-800 leading-tight">{place.name}</div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px] font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">
            <Star size={8} fill="currentColor" /> {place.rating || '-'}
          </div>
          {travelText && <div className="text-[10px] text-slate-400 font-mono">{travelText}</div>}
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-slate-500">{place.category}</div>
          {/* Dynamic Crowd/Wait Badge */}
          {(waitTime > 0 || crowd === 'High') && (
            <div className={`text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${isCrowded ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
              <Clock size={8} /> 
              {waitTime > 0 ? `Wait: ~${waitTime}m` : `Crowd: ${crowd}`}
            </div>
          )}
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-600 p-1.5 rounded-full hover:bg-blue-100">
          <Check size={14} />
        </button>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hovered && (place.description || place.highlight) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-800 text-white p-3 rounded-xl shadow-xl text-xs pointer-events-none"
          >
             {place.highlight && <div className="font-bold text-yellow-400 mb-1">✨ {place.highlight}</div>}
             <div className="opacity-90 leading-relaxed">{place.description || 'A great spot to visit.'}</div>
             {/* Arrow */}
             <div className="absolute top-0 left-8 -mt-1 w-2 h-2 bg-slate-800 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyState() {
  return <div className="text-center py-8 text-slate-400 text-sm italic">No more places here</div>;
}

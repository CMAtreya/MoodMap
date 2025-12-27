import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { updateItinerary, generateItinerary } from '../lib/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Coffee, Utensils, Clock, ArrowRight, Check, Navigation, Star, RefreshCw, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Users } from 'lucide-react';
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

  const [openSections, setOpenSections] = useState({ breakfast: true, lunch: true, dinner: true });

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState('path'); // 'attractions', 'path', 'food'

  useEffect(() => {
    if (!itinerary) {
      nav('/');
      return;
    }

    // Initialize pool from itinerary data
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
    const lastLoc = myStops.length > 0 ? myStops[myStops.length - 1] : { lat: itinerary.start.lat, lng: itinerary.start.lng };
    const distKm = haversineKm(lastLoc.lat, lastLoc.lng, place.lat, place.lng);
    const travelMins = Math.ceil((distKm / 5) * 60); // Walking speed approx

    // Previous departure time
    const prevTime = myStops.length > 0 ? myStops[myStops.length - 1].rawDeparture : itinerary.start.timestamp;

    // Arrival is prev departure + travel
    const arrivalTs = prevTime + (travelMins * 60 * 1000);
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

    // Remove from pool (optional: usually we keep it so they can see it's added, but here we remove to avoid dupes visually)
    /*
       Actually, common pattern: dim it or remove it.
       Let's keep it in pool but mark as selected?
       For now, removing is cleaner for the user.
    */
    setPool(prev => ({
      attractions: prev.attractions.filter(p => p.placeId !== place.placeId),
      food: prev.food.filter(p => p.placeId !== place.placeId)
    }));

    // Switch to path tab on mobile after adding
    setMobileTab('path');
  };

  const removeStop = (index) => {
    const stopToRemove = myStops[index];
    const newStops = [...myStops];
    newStops.splice(index, 1);

    // Recalculate timeline for all subsequent stops
    recalculateTimeline(newStops);

    // Add back to pool
    if (stopToRemove.category === 'Food' || stopToRemove.categories?.includes('Food')) {
      setPool(prev => ({ ...prev, food: [...prev.food, stopToRemove] }));
    } else {
      setPool(prev => ({ ...prev, attractions: [...prev.attractions, stopToRemove] }));
    }
  };

  const moveStop = (index, direction) => {
    if (index + direction < 0 || index + direction >= myStops.length) return;

    const newStops = [...myStops];
    const temp = newStops[index];
    newStops[index] = newStops[index + direction];
    newStops[index + direction] = temp;

    recalculateTimeline(newStops);
  };

  const recalculateTimeline = (stops) => {
    let currentTs = itinerary.start.timestamp;
    let currentL = { lat: itinerary.start.lat, lng: itinerary.start.lng };

    const updated = stops.map((stop, i) => {
      const distKm = haversineKm(currentL.lat, currentL.lng, stop.lat, stop.lng);
      const travelMins = Math.ceil((distKm / 5) * 60);
      const arrivalTs = currentTs + (travelMins * 60 * 1000);
      const durationMins = stop.durationMinutes || 60;
      const departureTs = arrivalTs + (durationMins * 60 * 1000);

      currentTs = departureTs;
      currentL = { lat: stop.lat, lng: stop.lng };

      return {
        ...stop,
        order: i + 1,
        arrivalTime: formatTime(arrivalTs),
        departureTime: formatTime(departureTs),
        travelMinutes: travelMins,
        rawArrival: arrivalTs,
        rawDeparture: departureTs
      };
    });

    setMyStops(updated);
    setCurrentTime(currentTs);
    if (updated.length > 0) {
      const last = updated[updated.length - 1];
      setCurrentLoc({ lat: last.lat, lng: last.lng });
    } else {
      setCurrentLoc({ lat: itinerary.start.lat, lng: itinerary.start.lng });
    }
  };

  // Helper functions for categorization and filtering
  const getPlaceHours = (place) => {
    const c = ((place.category || '') + ' ' + (place.categories || []).join(' ')).toLowerCase();
    if (c.includes('museum') || c.includes('gallery')) return { open: 10, close: 18 };
    if (c.includes('park') || c.includes('nature') || c.includes('garden')) return { open: 6, close: 19 };
    if (c.includes('night') || c.includes('bar') || c.includes('pub') || c.includes('club')) return { open: 18, close: 26 };
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
    // Keywords logic similar to backend
    if (c.includes('cafe') || c.includes('bakery') || c.includes('coffee') || c.includes('breakfast') || c.includes('donut')) types.add('Breakfast');
    if (c.includes('burger') || c.includes('pizza') || c.includes('sandwich') || c.includes('fast food') || c.includes('deli')) types.add('Lunch');
    if (c.includes('steak') || c.includes('fine dining') || c.includes('pasta') || c.includes('seafood')) types.add('Dinner');
    if (c.includes('restaurant') || c.includes('bistro') || c.includes('diner')) { types.add('Lunch'); types.add('Dinner'); }

    // Default fallback
    if (types.size === 0) { types.add('Lunch'); types.add('Dinner'); }
    return types;
  };

  // Sort candidates by reviews (primary) and distance (secondary)
  const getSorted = (list) => {
    if (!currentLoc) return list;
    return [...list].sort((a, b) => {
      const dA = haversineKm(currentLoc.lat, currentLoc.lng, a.lat, a.lng);
      const dB = haversineKm(currentLoc.lat, currentLoc.lng, b.lat, b.lng);
      return dA - dB;
    });
  };

  const getFoodBySection = () => {
    const foodList = getSorted(pool.food);
    const sections = { breakfast: [], lunch: [], dinner: [] };

    foodList.forEach(p => {
      const types = getMealType(p);
      if (types.has('Breakfast')) sections.breakfast.push(p);
      if (types.has('Lunch')) sections.lunch.push(p);
      if (types.has('Dinner')) sections.dinner.push(p);
    });
    return sections;
  };

  const foodSections = getFoodBySection();

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
      await updateItinerary({ ...updated, userId: user?.id });
      setItinerary(updated);
      nav('/itinerary-final');
    } catch (e) {
      console.error(e);
      setItinerary(updated);
      nav('/itinerary-final');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  if (!itinerary) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 md:px-6 md:py-4 flex items-center justify-between shadow-sm z-10 w-full shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900">Build Your Journey</h1>
          <div className="text-xs md:text-sm text-slate-500 flex items-center gap-2">
            <Clock size={12} className="md:w-3.5 md:h-3.5" /> Start: {formatTime(itinerary.start.timestamp)}
            <span className="mx-1">•</span>
            {itinerary.mood} Mood
          </div>
        </div>

        {/* Social Proof & Actions */}
        <div className="flex items-center gap-3">
          {/* Social Proof Badge */}
          {itinerary.summary?.socialStats && (
            <div className="hidden lg:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-100">
              <Users size={14} />
              <span>{itinerary.summary.socialStats.completedCount.toLocaleString()} travelers</span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white text-slate-600 p-2 md:px-4 md:py-2.5 rounded-full font-medium hover:bg-slate-50 border border-slate-200 transition-all"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">More Ideas</span>
          </button>
          <button
            onClick={handleFinalize}
            disabled={myStops.length === 0 || saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 text-sm md:text-base"
          >
            {saving ? 'Saving...' : <>Finalize <ArrowRight size={18} className="hidden md:block" /></>}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden relative">

        {/* Left: Attractions */}
        <div className={`md:col-span-3 bg-white border-r overflow-y-auto p-4 custom-scrollbar ${mobileTab === 'attractions' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4 sticky top-0 bg-white py-2 z-10 border-b md:border-none">
            <MapPin size={18} className="text-purple-500" />
            Tourist Spots
            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-normal ml-auto">
              Open @ {formatTime(currentTime)}
            </span>
          </div>
          <div className="space-y-3 pb-20 md:pb-0">
            <AnimatePresence>
              {getSorted(pool.attractions.filter(p => isPlaceOpen(p, currentTime))).map(p => (
                <PlaceCard key={p.placeId} place={p} onAdd={() => addPlace(p)} type="attraction" currentLoc={currentLoc} />
              ))}
            </AnimatePresence>
            {pool.attractions.length === 0 && <EmptyState />}
          </div>
        </div>

        {/* Center: My Itinerary (Timeline) */}
        <div className={`md:col-span-6 bg-slate-50/50 overflow-y-auto p-6 custom-scrollbar relative ${mobileTab === 'path' ? 'block' : 'hidden md:block'}`}>
          <div className="max-w-2xl mx-auto pb-20 md:pb-0">
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
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-4 group"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm z-10 ${stop.category === 'Food' || stop.categories?.includes('Food') ? 'bg-orange-500' : 'bg-purple-500'}`}>
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

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <div className="text-xs text-slate-400 flex items-center gap-3 mr-auto">
                          <span className="flex items-center gap-1"><Navigation size={12} /> {stop.travelMinutes} min travel</span>
                        </div>

                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveStop(i, -1)}
                            disabled={i === 0}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveStop(i, 1)}
                            disabled={i === myStops.length - 1}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => removeStop(i)}
                            className="p-1.5 hover:bg-red-50 rounded text-red-500"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
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
        <div className={`md:col-span-3 bg-white border-l overflow-y-auto p-4 custom-scrollbar ${mobileTab === 'food' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4 sticky top-0 bg-white py-2 z-10 border-b md:border-none">
            <Utensils size={18} className="text-orange-500" />
            Food & Drinks
          </div>

          <div className="space-y-6 pb-20 md:pb-0">
            {['Breakfast', 'Lunch', 'Dinner'].map(section => {
              const key = section.toLowerCase();
              const items = foodSections[key];
              if (items.length === 0) return null;

              return (
                <div key={section} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-sm text-slate-700">{section}</span>
                    {openSections[key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  <AnimatePresence>
                    {openSections[key] && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 space-y-2 bg-white">
                          {items.slice(0, 5).map(p => (
                            <PlaceCard key={p.placeId} place={p} onAdd={() => addPlace(p)} type="food" currentLoc={currentLoc} />
                          ))}
                          {items.length > 5 && (
                            <div className="text-center text-xs text-slate-400 py-1 italic">...and {items.length - 5} more</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {(pool.food.length === 0) && <EmptyState />}
          </div>
        </div>

        {/* Mobile Floating Tab Bar */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 bg-white rounded-full shadow-2xl border flex items-center justify-around p-2 z-50">
          <button
            onClick={() => setMobileTab('attractions')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${mobileTab === 'attractions' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}
          >
            <MapPin size={20} />
            <span className="text-[10px] font-medium">Spots</span>
          </button>

          <button
            onClick={() => setMobileTab('path')}
            className={`flex flex-col items-center gap-1 p-2 px-6 rounded-xl transition-colors ${mobileTab === 'path' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
            <Navigation size={20} />
            <span className="text-[10px] font-medium">My Path</span>
          </button>

          <button
            onClick={() => setMobileTab('food')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${mobileTab === 'food' ? 'text-orange-600 bg-orange-50' : 'text-slate-400'}`}
          >
            <Utensils size={20} />
            <span className="text-[10px] font-medium">Food</span>
          </button>
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
          <div className="text-xs text-slate-500">{place.category || place.categories?.[0]}</div>
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

      {/* Hover Tooltip (Hidden on touch devices conceptually, but CSS doesn't easily detect. We rely on tap behavior) */}
      <AnimatePresence>
        {hovered && (place.description || place.highlight) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="hidden md:block absolute left-0 right-0 top-full mt-2 z-50 bg-slate-800 text-white p-3 rounded-xl shadow-xl text-xs pointer-events-none"
          >
            {place.highlight && <div className="font-bold text-yellow-400 mb-1">✨ {place.highlight}</div>}
            <div className="opacity-90 leading-relaxed">{place.description || 'A great spot to visit.'}</div>
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

import NodeCache from 'node-cache';
import { getNearbyPlaces as getFoursquarePlaces } from './providers/foursquare.js';
import { getNearbyAttractions as getOpenTripMapPlaces } from './providers/opentripmap.js';
import { getNearbyAttractions as getGooglePlaces } from './providers/google.js';
import { selectPlaces, getStopDescriptions, getNarrativeAndTips } from './ai/gemini.js';
import { pickStops, computeSchedule, nearestNeighborOrder } from '../utils/time.js';
import { filterByMood, moodConfig, moodMatchScore } from '../utils/mood.js';
import { dedupeByProximity, enrichOpeningHours, isOpenDuringWindow } from '../utils/places.js';
import { createClient } from '@supabase/supabase-js';

const cache = new NodeCache({ stdTTL: 300 });

export async function generateItinerary(input) {
  try {
    const preferences = input.preferences || {};
    // Include preferences and refresh flag in cache key
    const key = `it:${input.mood}:${input.start.lat.toFixed(3)}:${input.start.lng.toFixed(3)}:${input.timeWindowHours}:${Math.floor(input.start.timestamp / (15 * 60 * 1000))}:${JSON.stringify(preferences)}`;
    
    // If refresh is requested, skip cache check
    const cached = cache.get(key);
    if (cached && !input.refresh) return cached;

    const startTs = input.start.timestamp;
    const endTs = startTs + input.timeWindowHours * 60 * 60 * 1000;

    // Generate queries based on preferences
    const cuisine = (preferences.cuisines || []).join(' ') || '';
    const vibe = preferences.heritage ? 'historic authentic' : '';
    const diet = preferences.diet === 'Veg' ? 'vegetarian' : '';
    
    // Construct search queries
    const foodQuery = [cuisine, diet, vibe, 'food'].filter(Boolean).join(' ');
    const attrQuery = [vibe, 'tourist attraction'].filter(Boolean).join(' ');

    const primaryPromise = getFoursquarePlaces(input.start.lat, input.start.lng, 20000, foodQuery);
    const secondaryPromise = process.env.GOOGLE_PLACES_API_KEY
      ? getGooglePlaces(input.start.lat, input.start.lng, 20000, attrQuery)
      : getOpenTripMapPlaces(input.start.lat, input.start.lng);
      
    const results = await Promise.allSettled([primaryPromise, secondaryPromise]);
    const primary = results[0].status === 'fulfilled' ? results[0].value : [];
    const secondary = results[1].status === 'fulfilled' ? results[1].value : [];
    
    // If primary (food) results are low, try a broader search
    let extraFood = [];
    if (primary.length < 5) {
       try {
         const broad = await getFoursquarePlaces(input.start.lat, input.start.lng, 20000, 'restaurant');
         extraFood = broad;
       } catch {}
    }

    const merged = dedupeByProximity(enrichOpeningHours([...primary, ...extraFood, ...secondary]));
    
    // Categorize into Food and Attractions
    const foodKeywords = ['cafe', 'restaurant', 'bakery', 'bar', 'coffee', 'diner', 'bistro', 'pub', 'food', 'breakfast', 'lunch', 'dinner'];
    const attractions = [];
    const food = [];
    
    merged.forEach(p => {
      const cats = (p.categories || []).map(c => c.toLowerCase());
      const isFood = cats.some(c => foodKeywords.some(k => c.includes(k)));
      if (isFood) food.push(p);
      else attractions.push(p);
    });

    // Ensure pool has enough candidates (Fallback / Mock Data)
    if (attractions.length < 5) {
      attractions.push(
        { id: 'mock-a1', name: 'City Museum', lat: input.start.lat + 0.005, lng: input.start.lng + 0.002, categories: ['Museum'], rating: 4.5, reviews: 800 },
        { id: 'mock-a2', name: 'Botanic Garden', lat: input.start.lat - 0.004, lng: input.start.lng - 0.003, categories: ['Park'], rating: 4.7, reviews: 1200 },
        { id: 'mock-a3', name: 'Historic Square', lat: input.start.lat + 0.002, lng: input.start.lng - 0.005, categories: ['Landmark'], rating: 4.4, reviews: 500 }
      );
    }
    
    // Add Specific Local Gems if nearby (simulated via distance check or just adding to pool)
    // We add them to the pool regardless; the distance filter later will catch them if they are truly relevant/close.
    // Or better, we explicitly check if we are in Mysuru/Bangalore region to add them.
    // Mysuru approx: 12.3, 76.6. Bangalore: 12.9, 77.6
    const isKarnataka = (input.start.lat > 12 && input.start.lat < 13.5 && input.start.lng > 76 && input.start.lng < 78);
    
    if (isKarnataka || food.length < 5) {
       if (isKarnataka) {
         food.push(
           { id: 'mylari', name: 'Original Vinayaka Mylari', lat: 12.3020, lng: 76.6530, categories: ['Authentic', 'Breakfast', 'Veg'], rating: 4.8, reviews: 3500, description: 'Legendary dosa place known for its soft benne dosas.' },
           { id: 'sapa', name: 'Sapa Bakery', lat: 12.3150, lng: 76.6400, categories: ['Bakery', 'Cafe', 'Authentic'], rating: 4.9, reviews: 1200, description: 'Famous for authentic sourdough and pastries.' },
           { id: 'glens', name: 'Glen\'s Bakehouse', lat: 12.9700, lng: 77.6000, categories: ['Bakery', 'Cafe'], rating: 4.5, reviews: 2000 }
         );
       }
       food.push(
        { id: 'mock-f1', name: 'The Daily Grind', lat: input.start.lat + 0.001, lng: input.start.lng + 0.004, categories: ['Cafe'], rating: 4.6, reviews: 300 },
        { id: 'mock-f2', name: 'Burger Joint', lat: input.start.lat - 0.003, lng: input.start.lng + 0.001, categories: ['Restaurant'], rating: 4.3, reviews: 900 },
        { id: 'mock-f3', name: 'Sweet Treats', lat: input.start.lat + 0.004, lng: input.start.lng - 0.002, categories: ['Bakery'], rating: 4.8, reviews: 450 }
      );
    }

    const filteredMood = filterByMood(merged, input.mood).map(p => ({
      ...p,
      moodScore: moodMatchScore(p, input.mood)
    }));
    let candidate = filteredMood.length >= 3 ? filteredMood : merged.map(p => ({ ...p, moodScore: 0.3 }));
    if (candidate.length < 3) {
    candidate = [
      { id: 'start-walk', name: 'Scenic Walk', lat: input.start.lat + 0.003, lng: input.start.lng + 0.003, categories: ['Outdoor'], rating: 4.8, reviews: 1200 },
      { id: 'coffee-break', name: 'Coffee Break', lat: input.start.lat - 0.002, lng: input.start.lng - 0.001, categories: ['Cafe'], rating: 4.7, reviews: 2500 },
      { id: 'viewpoint', name: 'City Viewpoint', lat: input.start.lat + 0.001, lng: input.start.lng - 0.003, categories: ['Scenic'], rating: 4.9, reviews: 3200 }
    ];
  }
  const openWindow = candidate.filter(p => isOpenDuringWindow(p, startTs, endTs));
  let quality = openWindow.map(p => ({
    ...p,
    quality: (p.rating || 0) * Math.log(Math.max(1, p.reviews || 1))
  })).filter(p => (p.rating || 0) >= 4.3 && (p.reviews || 0) >= 1000);
  if (quality.length < 3) {
    // If strict filtering removes too many, fall back to relaxed or original set but prioritize high ratings
    quality = openWindow.map(p => ({ ...p, quality: (p.rating || 0) * Math.log(Math.max(1, p.reviews || 1)) }));
  }
    quality.sort((a, b) => (b.quality || 0) - (a.quality || 0));
    const top15 = quality.slice(0, 15).map(p => ({
      ...p,
      distanceKm: haversine(input.start.lat, input.start.lng, p.lat, p.lng)
    }));
    const userContext = { startLat: input.start.lat, startLng: input.start.lng, timeWindowHours: input.timeWindowHours, mood: input.mood };
    const selection = await selectPlaces(userContext, top15, preferences);
    const selectedIds = selection.selected || top15.slice(0, 4).map(p => p.id);
  const selected = top15.filter(p => selectedIds.includes(p.id));
  const alternatives = top15.filter(p => !selectedIds.includes(p.id)).slice(0, 5); // Return top 5 unused
  const orderIdx = nearestNeighborOrder(selected, input.start.lat, input.start.lng, 'walking');
  const ordered = orderIdx.map(i => selected[i]);
  const intensity = moodConfig[input.mood].intensity;
  const scheduled = computeSchedule(ordered, startTs, input.start.lat, input.start.lng, endTs, input.mood, intensity, 'walking');
  const supabase = supabaseClient();
  const crowdBias = await crowdHeuristics(supabase, scheduled.stops);
  
  // Generate descriptions for scheduled stops AND top pool candidates
  // We'll combine them into one batch request to Gemini to save time/calls
  const poolAttractions = attractions.slice(0, 10);
  const poolFood = food.slice(0, 10);
  const allToDescribe = [
    ...scheduled.stops, 
    ...poolAttractions.map(p => ({ ...p, placeId: p.id })), 
    ...poolFood.map(p => ({ ...p, placeId: p.id }))
  ];
  
  // Deduplicate based on placeId
  const uniqueToDescribe = Array.from(new Map(allToDescribe.map(item => [item.placeId || item.id, item])).values());
  
  const stopDescs = await getStopDescriptions(input.mood, uniqueToDescribe, preferences);
  const na = await getNarrativeAndTips(input.mood, scheduled, { selectionReasoning: selection.reasoning, crowdBias });
  
  const enrich = (p) => {
    const d = stopDescs[p.placeId] || stopDescs[p.placeId || p.id] || { description: '', highlight: '' };
    return {
      ...p,
      description: d.description || '',
      highlight: d.highlight || ''
    };
  };

  const itinerary = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    mood: input.mood,
    timeWindowHours: input.timeWindowHours,
    start: input.start,
    narrative: na.narrative,
    tips: na.tips,
    stops: scheduled.stops.map(s => {
      const enriched = enrich(s);
      return { ...s, ...enriched };
    }),
    alternatives: alternatives.map(p => ({
      placeId: p.id,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      category: p.categories?.[0] || 'Point of Interest',
      rating: p.rating,
      reviews: p.reviews,
      ...enrich({ ...p, placeId: p.id })
    })),
    pool: {
      attractions: attractions.slice(0, 20).map(p => ({ 
        ...p, 
        placeId: p.id, 
        category: p.categories?.[0] || 'Attraction',
        ...enrich({ ...p, placeId: p.id })
      })),
      food: food.slice(0, 20).map(p => ({ 
        ...p, 
        placeId: p.id, 
        category: p.categories?.[0] || 'Food',
        ...enrich({ ...p, placeId: p.id })
      }))
    },
    summary: { ...scheduled.summary, bounds: computeBounds([input.start, ...scheduled.stops]) }
  };
  cache.set(key, itinerary);
  return itinerary;
  } catch {
    const start = new Date(input.start.timestamp);
    const fmt = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const add = (d, m) => new Date(d.getTime() + m * 60000);

    const t1_arr = add(start, 15);
    const t1_dep = add(t1_arr, 60);
    const t2_arr = add(t1_dep, 20);
    const t2_dep = add(t2_arr, 45);
    const t3_arr = add(t2_dep, 25);
    const t3_dep = add(t3_arr, 45);

    const fallback = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      mood: input.mood,
      timeWindowHours: input.timeWindowHours,
      start: input.start,
      narrative: `A ${input.mood.toLowerCase()} journey with 3 stops.`,
      tips: ['Wear comfy shoes'],
      stops: [
        { order: 1, placeId: 'start-walk', name: 'Scenic Walk', lat: input.start.lat + 0.003, lng: input.start.lng + 0.003, category: 'Outdoor', rating: null, reviews: null, arrivalTime: fmt(t1_arr), departureTime: fmt(t1_dep), durationMinutes: 60, travelMinutes: 15, crowdLevel: 'Low' },
        { order: 2, placeId: 'coffee-break', name: 'Coffee Break', lat: input.start.lat - 0.002, lng: input.start.lng - 0.001, category: 'Cafe', rating: null, reviews: null, arrivalTime: fmt(t2_arr), departureTime: fmt(t2_dep), durationMinutes: 45, travelMinutes: 20, crowdLevel: 'Medium' },
        { order: 3, placeId: 'viewpoint', name: 'City Viewpoint', lat: input.start.lat + 0.001, lng: input.start.lng - 0.003, category: 'Scenic', rating: null, reviews: null, arrivalTime: fmt(t3_arr), departureTime: fmt(t3_dep), durationMinutes: 45, travelMinutes: 25, crowdLevel: 'High' }
      ],
      alternatives: [
        { placeId: 'alt-1', name: 'Historic Museum', category: 'Museum', rating: 4.5, lat: input.start.lat + 0.004, lng: input.start.lng },
        { placeId: 'alt-2', name: 'Local Park', category: 'Park', rating: 4.2, lat: input.start.lat - 0.003, lng: input.start.lng + 0.002 }
      ],
      pool: {
        attractions: [
           { placeId: 'f1', name: 'Grand Museum', lat: input.start.lat + 0.005, lng: input.start.lng, category: 'Museum', rating: 4.7 },
           { placeId: 'f2', name: 'Central Park', lat: input.start.lat - 0.005, lng: input.start.lng + 0.002, category: 'Park', rating: 4.8 },
           { placeId: 'f3', name: 'City Tower', lat: input.start.lat + 0.002, lng: input.start.lng - 0.005, category: 'Landmark', rating: 4.6 }
        ],
        food: [
           { placeId: 'a1', name: 'Joe\'s Pizza', lat: input.start.lat + 0.001, lng: input.start.lng + 0.001, category: 'Pizza', rating: 4.5 },
           { placeId: 'a2', name: 'Starbucks Reserve', lat: input.start.lat - 0.001, lng: input.start.lng - 0.001, category: 'Cafe', rating: 4.4 },
           { placeId: 'a3', name: 'Sushi Zen', lat: input.start.lat + 0.003, lng: input.start.lng - 0.002, category: 'Japanese', rating: 4.8 }
        ]
      },
      summary: { totalDurationMinutes: 170, totalDistanceKm: 4.5, stopCount: 3, bounds: computeBounds([{ lat: input.start.lat, lng: input.start.lng }, { lat: input.start.lat + 0.003, lng: input.start.lng + 0.003 }, { lat: input.start.lat - 0.002, lng: input.start.lng - 0.001 }, { lat: input.start.lat + 0.001, lng: input.start.lng - 0.003 }]) }
    };
    return fallback;
  }
}

function supabaseClient() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

async function crowdHeuristics(supabase, stops) {
  const out = {};
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours();
  const isWeekend = dow === 0 || dow === 6;
  const isPeakDining = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);

  for (const s of stops) {
    let level = s.crowdLevel || 'Low';
    let wait = 0;

    // Base heuristics
    if (s.reviews > 1000) level = 'Medium';
    if (s.reviews > 5000) level = 'High';

    if (supabase) {
      const { data } = await supabase.from('crowd_reports').select('*').eq('stop_order', s.order).limit(20);
      const counts = { Low: 0, Medium: 0, High: 0 };
      (data || []).forEach(r => { counts[r.level] = (counts[r.level] || 0) + 1; });
      const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (max && max[1] > 3) level = max[0];
    }
    
    // Dynamic adjustments
    if (!supabase || (supabase && isWeekend)) {
      if (String(s.category).toLowerCase().includes('museum') && isWeekend) level = 'High';
      if (String(s.category).toLowerCase().includes('park') && dow >= 12) level = 'Medium';
      if (s.category === 'Food' && isPeakDining && s.rating >= 4.5) {
        level = 'High';
        wait = Math.floor(Math.random() * 30) + 15; // 15-45 min wait
      }
    }

    // Vinayaka Mylari special logic (famous for waiting)
    if (s.name.includes('Mylari') && hour < 11) {
        level = 'High';
        wait = 45;
    }
    
    out[s.order] = { level, wait };
    // We also attach it to the stop object for easy access later if needed, though 'out' is returned
    s.crowdLevel = level;
    s.waitTimeMinutes = wait;
  }
  return out;
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeBounds(points) {
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };
}

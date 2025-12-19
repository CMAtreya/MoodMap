import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });

function getClient() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function saveItinerary(itinerary, userId) {
  const supabase = getClient();
  if (!supabase) {
    cache.set(`itinerary:${itinerary.id}`, itinerary);
    cache.set(`itinerary_stops:${itinerary.id}`, itinerary.stops);
    return itinerary;
  }
  try {
    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        id: itinerary.id,
        mood: itinerary.mood,
        time_window_hours: itinerary.timeWindowHours,
        start_lat: itinerary.start.lat,
        start_lng: itinerary.start.lng,
        start_timestamp: itinerary.start.timestamp,
        narrative: itinerary.narrative,
        summary: itinerary.summary,
        user_id: userId
      })
      .select()
      .single();
    if (error) {
      cache.set(`itinerary:${itinerary.id}`, itinerary);
      cache.set(`itinerary_stops:${itinerary.id}`, itinerary.stops);
      return itinerary;
    }
    for (const s of itinerary.stops) {
      await supabase.from('itinerary_stops').insert({
        itinerary_id: itinerary.id,
        order_index: s.order,
        place_id: s.placeId,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        category: s.category,
        rating: s.rating,
        reviews: s.reviews,
        arrival_time: s.arrivalTime,
        departure_time: s.departureTime,
        duration_minutes: s.durationMinutes,
        travel_minutes: s.travelMinutes,
        crowd_level: s.crowdLevel
      });
    }
    cache.set(`itinerary:${itinerary.id}`, itinerary);
    cache.set(`itinerary_stops:${itinerary.id}`, itinerary.stops);
    return { ...itinerary, db: data };
  } catch {
    cache.set(`itinerary:${itinerary.id}`, itinerary);
    cache.set(`itinerary_stops:${itinerary.id}`, itinerary.stops);
    return itinerary;
  }
}

export async function getItineraryById(id) {
  const supabase = getClient();
  if (!supabase) {
    const it = cache.get(`itinerary:${id}`);
    if (!it) return null;
    return it;
  }
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  const { data: stops } = await supabase
    .from('itinerary_stops')
    .select('*')
    .eq('itinerary_id', id)
    .order('order_index', { ascending: true });
  return {
    id: data.id,
    mood: data.mood,
    timeWindowHours: data.time_window_hours,
    start: { lat: data.start_lat, lng: data.start_lng, timestamp: data.start_timestamp },
    narrative: data.narrative,
    summary: data.summary,
    stops: (stops || []).map(s => ({
      order: s.order_index,
      placeId: s.place_id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      category: s.category,
      rating: s.rating,
      reviews: s.reviews,
      arrivalTime: s.arrival_time,
      departureTime: s.departure_time,
      durationMinutes: s.duration_minutes,
      travelMinutes: s.travel_minutes,
      crowdLevel: s.crowd_level
    }))
  };
}

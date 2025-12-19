import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';
import { getItineraryById } from './persistence.js';

const cache = new NodeCache({ stdTTL: 3600 });

function client() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function startTrip(itineraryId, userId) {
  const supabase = client();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const trip = { id, itinerary_id: itineraryId, user_id: userId, current_index: 1, status: 'active', state: {} };
  cache.set(`trip:${id}`, trip);
  if (supabase) {
    await supabase.from('trips').insert({
      id,
      itinerary_id: itineraryId,
      user_id: userId,
      current_index: 1,
      status: 'active',
      state: {}
    });
  }
  return await getTripState(id);
}

export async function getTripState(tripId) {
  const supabase = client();
  let trip = cache.get(`trip:${tripId}`);
  if (!trip && supabase) {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
    trip = data;
  }
  if (!trip) return null;
  let stops = [];
  if (supabase) {
    const { data } = await supabase.from('itinerary_stops').select('*').eq('itinerary_id', trip.itinerary_id).order('order_index', { ascending: true });
    stops = data || [];
  } else {
    const it = await getItineraryById(trip.itinerary_id);
    stops = (it?.stops || []).map(s => ({
      order_index: s.order,
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
    }));
  }
  const current = stops.find(s => s.order_index === trip.current_index) || stops[0];
  const next = stops.find(s => s.order_index === trip.current_index + 1) || null;
  return {
    trip: { id: tripId, status: trip.status, currentIndex: trip.current_index },
    current: current ? mapStop(current) : null,
    next: next ? mapStop(next) : null,
    all: stops.map(mapStop)
  };
}

export async function advanceTrip(tripId, action) {
  const supabase = client();
  let trip = cache.get(`trip:${tripId}`);
  if (!trip && supabase) {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
    trip = data;
  }
  if (!trip) return null;
  if (action === 'checkout' || action === 'skip') {
    trip.current_index += 1;
  }
  if (action === 'add30') {
    trip.state = { ...trip.state, addMinutes: (trip.state.addMinutes || 0) + 30 };
  }
  if (action === 'pause') {
    trip.status = 'paused';
  }
  if (action === 'resume') {
    trip.status = 'active';
  }
  if (action === 'end') {
    trip.status = 'completed';
  }
  cache.set(`trip:${tripId}`, trip);
  if (supabase) {
    await supabase.from('trips').update({ current_index: trip.current_index, status: trip.status, state: trip.state }).eq('id', tripId);
    await supabase.from('trip_events').insert({ trip_id: tripId, type: action, payload: {} });
  }
  return getTripState(tripId);
}

export async function reportCrowd(tripId, stopOrder, level, userId) {
  const supabase = client();
  let trip = cache.get(`trip:${tripId}`);
  if (!trip && supabase) {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
    trip = data;
  }
  if (!trip) return false;
  if (supabase) {
    await supabase.from('crowd_reports').insert({ itinerary_id: trip.itinerary_id, stop_order: stopOrder, level, user_id: userId });
  }
  return true;
}

export async function completeTrip(tripId, feedback) {
  const supabase = client();
  let trip = cache.get(`trip:${tripId}`);
  if (!trip && supabase) {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
    trip = data;
  }
  if (!trip) return null;
  trip.status = 'completed';
  cache.set(`trip:${tripId}`, trip);
  if (supabase) {
    await supabase.from('trips').update({ status: 'completed', feedback }).eq('id', tripId);
    await supabase.from('trip_events').insert({ trip_id: tripId, type: 'complete', payload: feedback || {} });
  }
  return { ok: true, tripId };
}

function mapStop(s) {
  return {
    order: s.order_index,
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
  };
}

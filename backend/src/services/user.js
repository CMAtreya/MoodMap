import { createClient } from '@supabase/supabase-js';

function client() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function listItineraries(userId) {
  const supabase = client();
  if (!supabase) return [];
  const q = supabase.from('itineraries').select('*').order('created_at', { ascending: false });
  const { data } = userId ? await q.eq('user_id', userId) : await q;
  return data || [];
}

export async function listSavedPlaces(userId) {
  const supabase = client();
  if (!supabase) return [];
  const { data } = await supabase.from('saved_places').select('*').eq('user_id', userId);
  return data || [];
}

export async function savePlace(userId, place) {
  const supabase = client();
  if (!supabase) return place;
  const { data } = await supabase.from('saved_places').insert({
    user_id: userId,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    rating: place.rating,
    reviews: place.reviews,
    tags: place.tags,
    notes: place.notes
  }).select().single();
  return data;
}

export async function deletePlace(id) {
  const supabase = client();
  if (!supabase) return true;
  await supabase.from('saved_places').delete().eq('id', id);
  return true;
}

export async function getProfileStats(userId) {
  const supabase = client();
  if (!supabase) return { tripsCompleted: 0, placesVisited: 0, favoriteMood: null, milesTraveled: 0, hoursAdventuring: 0 };
  const { data: trips } = await supabase.from('trips').select('*').eq('user_id', userId);
  const completed = (trips || []).filter(t => t.status === 'completed');
  const { data: itineraries } = await supabase.from('itineraries').select('*').eq('user_id', userId);
  const placesVisited = (completed || []).length * 3;
  return {
    tripsCompleted: completed.length,
    placesVisited,
    favoriteMood: (itineraries || [])[0]?.mood || null,
    milesTraveled: 0,
    hoursAdventuring: 0
  };
}

export async function getSettings(userId) {
  const supabase = client();
  if (!supabase) return { default_radius_km: 5, transport_mode: 'walking' };
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
  return data || { default_radius_km: 5, transport_mode: 'walking' };
}

export async function updateSettings(userId, payload) {
  const supabase = client();
  if (!supabase) return payload;
  const { data } = await supabase.from('user_settings').upsert({
    user_id: userId,
    default_radius_km: payload.default_radius_km,
    transport_mode: payload.transport_mode,
    accessibility: payload.accessibility,
    dietary: payload.dietary,
    notifications: payload.notifications,
    privacy: payload.privacy
  }).select().single();
  return data;
}

export async function updateProfile(userId, payload) {
  const supabase = client();
  if (!supabase) return payload;
  const { data } = await supabase.from('users').update({
    name: payload.name,
  }).eq('id', userId).select().single();
  return data;
}
import axios from 'axios';

export async function startTrip(itineraryId, userId) {
  const r = await axios.post('/api/trip/start', { 
    itineraryId, 
    userId: userId || undefined 
  });
  return r.data;
}

export async function getTripState(tripId) {
  const r = await axios.get(`/api/trip/${tripId}/state`);
  return r.data;
}

export async function advanceTrip(tripId, action) {
  const r = await axios.post(`/api/trip/${tripId}/advance`, { action });
  return r.data;
}

export async function reportCrowd(tripId, stopOrder, level, userId) {
  const r = await axios.post(`/api/trip/${tripId}/report-crowd`, { stopOrder, level, userId });
  return r.data;
}

export async function completeTrip(tripId, payload) {
  const r = await axios.post(`/api/trip/${tripId}/complete`, payload);
  return r.data;
}

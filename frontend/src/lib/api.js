import axios from 'axios';

export async function generateItinerary(mood, timeWindowHours, coords, userId, startTime = null, preferences = {}, refresh = false) {
  const r = await axios.post('/api/itinerary/generate', {
    mood: String(mood),
    timeWindowHours: Number(timeWindowHours),
    start: {
      lat: Number(coords.latitude),
      lng: Number(coords.longitude),
      timestamp: Number(startTime || Date.now())
    },
    preferences,
    refresh,
    userId: userId ? String(userId) : undefined
  });
  return r.data;
}

export async function updateItinerary(itinerary) {
  const r = await axios.put(`/api/itinerary/${itinerary.id}`, itinerary);
  return r.data;
}

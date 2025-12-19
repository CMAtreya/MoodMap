import axios from 'axios';

export async function fetchItineraryById(id) {
  const r = await axios.get(`/api/itinerary/${id}`);
  return r.data;
}

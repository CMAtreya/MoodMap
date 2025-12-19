import axios from 'axios';

export async function getNearbyAttractions(lat, lng, radius = 20000, query = 'attraction') {
  const key = process.env.GOOGLE_PLACES_API_KEY || '';
  if (!key) return [];

  // Google Places Nearby Search
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  
  try {
    const r = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: Math.min(radius, 50000), // Max 50km
        keyword: query, 
        key: key
      },
      timeout: 8000
    });

    const items = Array.isArray(r.data.results) ? r.data.results : [];

    return items.map(p => ({
      id: p.place_id,
      name: p.name,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      categories: p.types || [],
      rating: p.rating || null,
      reviews: p.user_ratings_total || null,
      source: 'google',
      hours: p.opening_hours?.open_now ? 'Open Now' : null
    })).filter(x => x.lat && x.lng);

  } catch (error) {
    console.error('Google Places API Error:', error.message);
    return [];
  }
}

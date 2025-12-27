import axios from 'axios';
import { cacheService } from '../../utils/cache.js';

export async function getNearbyPlaces(lat, lng, radius = 20000, query = '') {
  const key = process.env.FOURSQUARE_API_KEY || '';
  if (!key) return [];
  const url = 'https://api.foursquare.com/v3/places/search';
  try {
    const params = {
      ll: `${lat},${lng}`,
      radius: Math.min(radius, 100000), // Max 100km
      limit: 50,
      sort: 'RATING', // Sort by rating to get "best"
    };
    if (query) params.query = query;

    // Cache key based on params
    const cacheKey = `sq:places:${lat}:${lng}:${radius}:${query || 'all'}`;

    return await cacheService.getOrSet(cacheKey, async () => {
      const r = await axios.get(url, {
        headers: { Authorization: key },
        params,
        timeout: 8000
      });
      const items = Array.isArray(r.data.results) ? r.data.results : [];
      return items.map(p => ({
        id: p.fsq_id,
        name: p.name,
        lat: p.geocodes?.main?.latitude,
        lng: p.geocodes?.main?.longitude,
        categories: (p.categories || []).map(c => c.name),
        rating: p.rating || null,
        reviews: p.stats?.total_ratings || null,
        source: 'foursquare',
        hours: p.hours || null
      })).filter(x => x.lat && x.lng);
    }, 86400); // 24 hours cache

  } catch {
    return [];
  }
}

import axios from 'axios';

export async function getNearbyAttractions(lat, lng) {
  const key = process.env.OPENTRIPMAP_API_KEY || '';
  if (!key) return [];
  const radius = 8000;
  const url = 'https://api.opentripmap.com/0.1/en/places/radius';
  const r = await axios.get(url, {
    params: {
      radius,
      lon: lng,
      lat,
      rate: 3,
      limit: 80,
      apikey: key
    },
    timeout: 8000
  });
  const items = Array.isArray(r.data.features) ? r.data.features : [];
  return items.map(f => ({
    id: f.properties?.xid,
    name: f.properties?.name,
    lat: f.geometry?.coordinates?.[1],
    lng: f.geometry?.coordinates?.[0],
    categories: f.properties?.kinds ? f.properties.kinds.split(',') : [],
    rating: f.properties?.rate || null,
    reviews: null,
    source: 'opentripmap',
    hours: null
  })).filter(x => x.name && x.lat && x.lng);
}

export function haversine(lat1, lon1, lat2, lon2) {
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

export function pickStops(places, hours) {
  const count = Math.min(4, Math.max(3, Math.round(hours / 3)));
  const sorted = [...places].sort((a, b) => (b.quality || 0) - (a.quality || 0));
  return sorted.slice(0, count);
}

export function computeSchedule(stops, startTs, startLat, startLng, endTs, mood, intensity, mode = 'walking') {
  const result = [];
  let currentTs = startTs;
  let prevLat = startLat;
  let prevLng = startLng;
  let totalMinutes = 0;
  let totalKm = 0;
  let order = 1;
  for (const s of stops) {
    const km = haversine(prevLat, prevLng, s.lat, s.lng);
    const speedKmH = mode === 'walking' ? 5 : mode === 'biking' ? 15 : 40;
    const travelMin = Math.round((km / speedKmH) * 60);
    currentTs += travelMin * 60 * 1000;
    const durMin = estimateDurationMinutes(s.category, mood, intensity);
    if (endTs && currentTs + durMin * 60 * 1000 > endTs) break;
    const arrival = new Date(currentTs);
    const departTs = currentTs + durMin * 60 * 1000;
    const depart = new Date(departTs);
    result.push({
      order,
      placeId: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      category: (s.categories && s.categories[0]) || 'Place',
      rating: s.rating || null,
      reviews: s.reviews || null,
      arrivalTime: arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      departureTime: depart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: durMin,
      travelMinutes: travelMin,
      crowdLevel: crowdEstimate(arrival)
    });
    currentTs = departTs;
    prevLat = s.lat;
    prevLng = s.lng;
    totalMinutes += durMin + travelMin;
    totalKm += km;
    order += 1;
  }
  const summary = {
    totalDurationMinutes: totalMinutes,
    totalDistanceKm: Math.round(totalKm * 10) / 10,
    stopCount: result.length
  };
  return { stops: result, summary };
}

function crowdEstimate(date) {
  const h = date.getHours();
  if (h >= 18 && h <= 21) return 'High';
  if (h >= 12 && h <= 17) return 'Medium';
  return 'Low';
}

export function buildTravelMatrix(points, startLat, startLng, mode = 'walking') {
  const speedKmH = mode === 'walking' ? 5 : mode === 'biking' ? 15 : 40;
  const mins = (km) => Math.round((km / speedKmH) * 60);
  const n = points.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) matrix[i][j] = 0;
      else {
        const km = haversine(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
        matrix[i][j] = mins(km);
      }
    }
  }
  const startTimes = points.map(p => mins(haversine(startLat, startLng, p.lat, p.lng)));
  return { matrix, startTimes };
}

export function nearestNeighborOrder(points, startLat, startLng, mode = 'walking') {
  const { matrix, startTimes } = buildTravelMatrix(points, startLat, startLng, mode);
  const n = points.length;
  const visited = Array(n).fill(false);
  let current = startTimes.indexOf(Math.min(...startTimes));
  const order = [current];
  visited[current] = true;
  for (let k = 1; k < n; k++) {
    let best = -1;
    let bestCost = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && matrix[current][j] < bestCost) {
        best = j; bestCost = matrix[current][j];
      }
    }
    if (best === -1) break;
    visited[best] = true;
    order.push(best);
    current = best;
  }
  return order;
}

export function estimateDurationMinutes(category, mood, intensity) {
  const base = categoryMatch(category) === 'Food' ? 75 : categoryMatch(category) === 'Museum' ? 90 : 60;
  const scaled = Math.round(base * intensity);
  return Math.min(120, Math.max(30, scaled));
}

function categoryMatch(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('museum') || c.includes('gallery') || c.includes('art')) return 'Museum';
  if (c.includes('restaurant') || c.includes('cafe') || c.includes('bar') || c.includes('pub')) return 'Food';
  return 'General';
}

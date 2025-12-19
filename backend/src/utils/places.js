import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: Number(process.env.CACHE_TTL || 86400) });

export function dedupeByProximity(places, thresholdMeters = 50) {
  const result = [];
  for (const p of places) {
    const existing = result.find(r => distanceMeters(r.lat, r.lng, p.lat, p.lng) <= thresholdMeters);
    if (!existing) {
      result.push(p);
    } else {
      existing.categories = Array.from(new Set([...(existing.categories || []), ...(p.categories || [])]));
      existing.rating = Math.max(existing.rating || 0, p.rating || 0);
      existing.reviews = Math.max(existing.reviews || 0, p.reviews || 0);
    }
  }
  return result;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function enrichOpeningHours(places) {
  return places.map(p => {
    const key = `hours:${p.source}:${p.id}`;
    const cached = cache.get(key);
    if (cached) return { ...p, hours: cached };
    if (p.hours) {
      cache.set(key, p.hours);
      return p;
    }
    return p;
  });
}

export function isOpenDuringWindow(place, startTs, endTs, minMinutes = 30) {
  if (!place.hours) return true;
  const date = new Date(startTs);
  const dow = date.getDay();
  const intervals = extractIntervals(place.hours, dow, startTs, endTs);
  for (const [open, close] of intervals) {
    const overlap = Math.max(0, Math.min(close, endTs) - Math.max(open, startTs));
    if (overlap >= minMinutes * 60 * 1000) return true;
  }
  return false;
}

function extractIntervals(hoursObj, dow, startTs, endTs) {
  try {
    const regs = hoursObj.regular || hoursObj.hours?.regular || [];
    const day = regs.find(d => toDow(d.day));
    const intervals = [];
    const base = new Date(startTs);
    const dayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0).getTime();
    if (day && Array.isArray(day.open)) {
      for (const o of day.open) {
        const [oh, om] = o.start.split(':').map(Number);
        const [ch, cm] = o.end.split(':').map(Number);
        const open = dayStart + (oh * 60 + om) * 60 * 1000;
        const close = dayStart + (ch * 60 + cm) * 60 * 1000;
        intervals.push([open, close]);
      }
    }
    return intervals;
  } catch {
    return [];
  }
}

function toDow(dayStr) {
  const map = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
  return map[dayStr] !== undefined;
}

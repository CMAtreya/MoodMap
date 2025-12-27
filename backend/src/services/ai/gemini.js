import axios from 'axios';

export async function getNarrative(mood, scheduled) {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) {
    return `A ${mood.toLowerCase()} journey with ${scheduled.stops.length} stops.`;
  }
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const prompt = [
    {
      text: `Create a short engaging narrative (2-3 sentences) for a ${mood} itinerary with these stops and times: ${scheduled.stops.map(s => `${s.order}. ${s.name} (${s.arrivalTime} - ${s.departureTime})`).join('; ')}.`
    }
  ];
  try {
    const r = await axios.post(url, { contents: [{ parts: prompt }] }, { params: { key }, timeout: 8000 });
    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string' && text.trim().length > 0) return text.trim();
  } catch { }
  return `A ${mood.toLowerCase()} journey with ${scheduled.stops.length} stops.`;
}

export async function selectPlaces(userContext, places, preferences = {}) {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) {
    return { selected: places.slice(0, 4).map(p => p.id), reasoning: 'Fallback selection by quality' };
  }
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const promptText = `You are selecting 3-4 places for today's itinerary.
User context: ${JSON.stringify(userContext)}
Preferences: ${JSON.stringify(preferences)}
Important Constraints:
- If preferences.accessibility is true, prioritized places with flat access/elevators.
- If preferences.neurodivergent is true, avoid loud/busy places, prioritize "Quiet" and "Calm" tags.
- Crowd Preference: ${preferences.crowdPreference || 'okay'}.
Places: ${JSON.stringify(places.map(p => ({
    id: p.id, name: p.name, category: (p.categories && p.categories[0]) || 'Place', rating: p.rating || 0, reviews: p.reviews || 0, moodScore: p.moodScore || 0, distanceKm: p.distanceKm || 0
  })))}
Selection criteria: match user preferences (cuisine, heritage vibe) and mood.
Return JSON: {"selected":["id1","id2","id3","id4"],"reasoning":"short rationale"}`;
  try {
    const r = await axios.post(url, { contents: [{ parts: [{ text: promptText }] }] }, { params: { key }, timeout: 10000 });
    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      const parsed = JSON.parse(safeJson(text));
      if (parsed && Array.isArray(parsed.selected)) return parsed;
    } catch { }
  } catch { }
  return { selected: places.slice(0, 4).map(p => p.id), reasoning: 'Fallback selection by quality' };
}

export async function getStopDescriptions(mood, stops, preferences = {}) {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) return stops.reduce((acc, s) => ({ ...acc, [s.placeId || s.id]: { description: `${s.name}—a great ${s.category} for ${mood.toLowerCase()}`, highlight: 'Popular local spot' } }), {});

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const promptText = `For each stop, write a 1-line description and a "highlight" (Best Authentic Dish for food, or History/Importance for places).
Mood: ${mood}
Preferences: ${JSON.stringify(preferences)}
Stops: ${JSON.stringify(stops.map(s => ({ id: s.placeId || s.id, name: s.name, category: s.category })))}
Return JSON mapping placeId to { "description": "...", "highlight": "..." }`;

  try {
    const r = await axios.post(url, { contents: [{ parts: [{ text: promptText }] }] }, { params: { key }, timeout: 10000 });
    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    try {
      const parsed = JSON.parse(safeJson(text));
      return parsed;
    } catch {
      return stops.reduce((acc, s) => ({ ...acc, [s.placeId || s.id]: { description: `${s.name}—a great ${s.category} for ${mood.toLowerCase()}`, highlight: 'Popular local spot' } }), {});
    }
  } catch {
    return stops.reduce((acc, s) => ({ ...acc, [s.placeId || s.id]: { description: `${s.name}—a great ${s.category} for ${mood.toLowerCase()}`, highlight: 'Popular local spot' } }), {});
  }
}

export async function getNarrativeAndTips(mood, scheduled, context) {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) {
    return { narrative: `A ${mood.toLowerCase()} journey with ${scheduled.stops.length} stops.`, tips: ['Wear comfy shoes'] };
  }
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  const promptText = `Create 2-sentence journey narrative and 3 short smart tips for this ${mood} itinerary.
Context: ${JSON.stringify(context)}
Stops: ${JSON.stringify(scheduled.stops.map(s => ({ name: s.name, times: `${s.arrivalTime}-${s.departureTime}`, category: s.category })))}.
Return JSON: {"narrative":"...", "tips":["tip1","tip2","tip3"]}`;
  try {
    const r = await axios.post(url, { contents: [{ parts: [{ text: promptText }] }] }, { params: { key }, timeout: 10000 });
    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try {
      const parsed = JSON.parse(safeJson(text));
      return parsed;
    } catch {
      return { narrative: `A ${mood.toLowerCase()} journey with ${scheduled.stops.length} stops.`, tips: ['Wear comfy shoes'] };
    }
  } catch {
    return { narrative: `A ${mood.toLowerCase()} journey with ${scheduled.stops.length} stops.`, tips: ['Wear comfy shoes'] };
  }
}

function safeJson(text) {
  const trimmed = String(text).trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  return start >= 0 && end >= 0 ? trimmed.slice(start, end + 1) : '{}';
}

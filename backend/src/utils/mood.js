export const moodConfig = {
  Curious: { categories: ['Museum','Art','History','Science','Gallery','Exhibit','Landmark','Library'], intensity: 0.8 },
  Adventurous: { categories: ['Hiking','Trail','Climbing','Adventure','Outdoor','Park'], intensity: 1.2 },
  Relaxed: { categories: ['Cafe','Spa','Park','Beach','Tea','Garden'], intensity: 0.7 },
  Romantic: { categories: ['Romantic','Fine Dining','Wine','Sunset','Scenic','Garden'], intensity: 0.9 },
  Energetic: { categories: ['Gym','Dance','Sports','Skate','Trampoline','Arcade'], intensity: 1.1 },
  Social: { categories: ['Bar','Pub','Club','Market','Event','Festival'], intensity: 1.0 },
  'Family Fun': { categories: ['Zoo','Aquarium','Playground','Amusement','Farm','Kids','Family'], intensity: 0.9 }
};

export function filterByMood(places, mood) {
  const cats = moodConfig[mood].categories;
  return places.filter(p => {
    const c = (p.categories || []).map(x => String(x).toLowerCase());
    return c.some(k => cats.some(q => k.toLowerCase().includes(q.toLowerCase())));
  });
}

export function moodMatchScore(place, mood) {
  const cats = moodConfig[mood].categories.map(x => x.toLowerCase());
  const pcats = (place.categories || []).map(x => String(x).toLowerCase());
  const matches = pcats.filter(k => cats.some(q => k.includes(q)));
  const score = Math.min(1, matches.length / Math.max(1, cats.length / 4));
  return score;
}

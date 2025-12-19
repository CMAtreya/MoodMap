import { create } from 'zustand';

export const useMoodMap = create(set => ({
  mood: null,
  timeWindowHours: 3,
  startTime: null, // null means "now"
  itinerary: null,
  preferences: { cuisines: [], dietary: 'any', heritageVibe: false },
  user: null,
  setMood: mood => set({ mood }),
  setTimeWindow: h => set({ timeWindowHours: h }),
  setStartTime: t => set({ startTime: t }),
  setItinerary: it => set({ itinerary: it }),
  setPreferences: p => set({ preferences: p }),
  setUser: u => set({ user: u }),
  reset: () => set({ mood: null, timeWindowHours: 3, startTime: null, itinerary: null, preferences: { cuisines: [], dietary: 'any', heritageVibe: false } })
}));

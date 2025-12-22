// src/state/store.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMoodMap = create(
  persist(
    (set) => ({
      // Auth state
      user: null,
      loading: true,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      
      // Itinerary state
      mood: null,
      timeWindowHours: 3,
      startTime: null,
      itinerary: null,
      preferences: { 
        cuisines: [], 
        dietary: 'any', 
        heritageVibe: false 
      },
      
      // Actions
      setMood: (mood) => set({ mood }),
      setTimeWindow: (hours) => set({ timeWindowHours: hours }),
      setStartTime: (startTime) => set({ startTime }),
      setItinerary: (itinerary) => set({ itinerary }),
      setPreferences: (preferences) => set({ preferences }),
      
      reset: () => set({ 
        mood: null, 
        timeWindowHours: 3, 
        startTime: null, 
        itinerary: null, 
        preferences: { 
          cuisines: [], 
          dietary: 'any', 
          heritageVibe: false 
        } 
      })
    }),
    {
      name: 'moodmap-storage', // unique name
      partialize: (state) => ({ 
        mood: state.mood,
        timeWindowHours: state.timeWindowHours,
        startTime: state.startTime,
        preferences: state.preferences,
        itinerary: state.itinerary
      }), // Only persist itinerary data, not auth/loading which are handled by Supabase
    }
  )
);

export default useMoodMap;
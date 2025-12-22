// src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import useMoodMap from './state/store';
import ProtectedRoute from './components/ProtectedRoute';
import Nav from './components/Nav';

// Import your page components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import CreateProfile from './pages/CreateProfile';
import Settings from './pages/Settings';
import SavedItineraries from './pages/SavedItineraries';
import SavedPlaces from './pages/SavedPlaces';
import MoodSelection from './pages/MoodSelection';
import TimeSelection from './pages/TimeSelection';
import Preferences from './pages/Preferences';
import GeneratingItinerary from './pages/GeneratingItinerary';
import ItineraryResult from './pages/ItineraryResult';
import ItineraryBuilder from './pages/ItineraryBuilder';
import ItineraryFinal from './pages/ItineraryFinal';
import LiveTrip from './pages/LiveTrip';
import TripComplete from './pages/TripComplete';
import NotFound from './pages/NotFound';

function App() {
  const { setUser, setLoading } = useMoodMap();
  const location = useLocation();

  useEffect(() => {
    // Check active sessions and set the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="pt-16 min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Home />} />
            
            {/* Itinerary Creation Flow */}
            <Route element={<ProtectedRoute />}>
              <Route path="/mood" element={<MoodSelection />} />
              <Route path="/time-window" element={<TimeSelection />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/generating" element={<GeneratingItinerary />} />
              <Route path="/itinerary/:id" element={<ItineraryResult />} />
              <Route path="/builder" element={<ItineraryBuilder />} />
              <Route path="/itinerary-final" element={<ItineraryFinal />} />
              <Route path="/trip/:id/live" element={<LiveTrip />} />
              <Route path="/trip/:id/complete" element={<TripComplete />} />
              
              {/* User Profile & Settings */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<CreateProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/saved-itineraries" element={<SavedItineraries />} />
              <Route path="/saved-places" element={<SavedPlaces />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
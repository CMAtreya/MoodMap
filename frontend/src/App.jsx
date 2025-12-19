import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import MoodSelection from './pages/MoodSelection.jsx';
import TimeSelection from './pages/TimeSelection.jsx';
import Preferences from './pages/Preferences.jsx';
import GeneratingItinerary from './pages/GeneratingItinerary.jsx';
import ItineraryResult from './pages/ItineraryResult.jsx';
import ItineraryBuilder from './pages/ItineraryBuilder.jsx';
import ItineraryFinal from './pages/ItineraryFinal.jsx';
import LiveTrip from './pages/LiveTrip.jsx';
import TripComplete from './pages/TripComplete.jsx';
import SavedItineraries from './pages/SavedItineraries.jsx';
import SavedPlaces from './pages/SavedPlaces.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import { supabase } from './lib/supabase.js';
import { useMoodMap } from './state/store.js';
import Layout from './components/Layout.jsx';
import { Button } from './components/ui/Button.jsx';
import { motion } from 'framer-motion';

function Nav() {
  const loc = useLocation();
  const setUser = useMoodMap(s => s.setUser);
  const [user, setUserLocal] = React.useState(null);
  
  React.useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => { 
        setUserLocal(data?.user || null); 
        setUser(data?.user || null); 
        if (data?.user) {
          supabase.from('users').upsert({ id: data.user.id, email: data.user.email }).select().single();
        }
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { 
        setUserLocal(session?.user || null); 
        setUser(session?.user || null); 
        if (session?.user) {
          supabase.from('users').upsert({ id: session.user.id, email: session.user.email }).select().single();
        }
      });
      return () => { sub?.subscription?.unsubscribe?.(); };
    }
  }, [setUser]);

  const isHome = loc.pathname === '/';

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? 'bg-transparent py-4' : 'bg-white/70 backdrop-blur-md border-b border-white/20 py-2'}`}
    >
      <div className="mx-auto max-w-7xl px-6 h-12 flex items-center justify-between">
        <Link to="/" className="font-semibold text-xl tracking-tight flex items-center gap-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 font-bold">MoodMap</span>
        </Link>
        
        <div className="flex items-center gap-4">
           {user && (
             <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
               <Link to="/saved-itineraries" className="hover:text-slate-900 transition-colors">Trips</Link>
               <Link to="/saved-places" className="hover:text-slate-900 transition-colors">Places</Link>
             </nav>
           )}

          {supabase && (
            user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
                   {/* Avatar Placeholder */}
                   <div className="w-full h-full bg-gradient-to-tr from-indigo-400 to-purple-400" />
                </Link>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant={isHome ? "glass" : "default"} size="sm">Sign in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant={isHome ? "glass" : "outline"} size="sm">Sign up</Button>
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </motion.header>
  );
}

export default function App() {
  return (
    <Layout>
      <Nav />
      <main className="pt-20 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mood" element={<MoodSelection />} />
          <Route path="/time-window" element={<TimeSelection />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/generating" element={<GeneratingItinerary />} />
          <Route path="/builder" element={<ItineraryBuilder />} />
          <Route path="/itinerary-final" element={<ItineraryFinal />} />
          <Route path="/itinerary/:id" element={<ItineraryResult />} />
          <Route path="/trip/:id/live" element={<LiveTrip />} />
          <Route path="/trip/:id/complete" element={<TripComplete />} />
          <Route path="/saved-itineraries" element={<SavedItineraries />} />
          <Route path="/saved-places" element={<SavedPlaces />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
    </Layout>
  );
}

// src/components/Nav.jsx
import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useMoodMap from '../state/store';

function ChevronDownIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Nav() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useMoodMap();
  const location = window.location.pathname;
  const isHome = location === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHome ? 'bg-transparent py-4' : 'bg-white/70 backdrop-blur-md border-b border-white/20 py-2'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-xl tracking-tight flex items-center gap-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 font-bold">
            MoodMap
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <NavLink 
                to="/saved-itineraries" 
                className={({ isActive }) => 
                  `hover:text-slate-900 transition-colors ${
                    isActive ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                  }`
                }
              >
                Trips
              </NavLink>
              <NavLink 
                to="/saved-places" 
                className={({ isActive }) => 
                  `hover:text-slate-900 transition-colors ${
                    isActive ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                  }`
                }
              >
                Places
              </NavLink>
            </nav>
          )}

          {user ? (
            <div className="profile-dropdown relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${isProfileOpen ? 'transform rotate-180' : ''} ${isHome ? 'text-white' : 'text-slate-600'}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setIsProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <NavLink
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Sign in
              </NavLink>
              <NavLink
                to="/signup"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Sign up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
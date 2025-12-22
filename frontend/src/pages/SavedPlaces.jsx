// src/pages/SavedPlaces.jsx
import React, { useState, useEffect } from 'react';
import { useMoodMap } from '../state/store';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function SavedPlaces() {
  const { user } = useMoodMap();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPlaces = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_places')
          .select(`
            id,
            place_id,
            name,
            address,
            created_at,
            place_type
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPlaces(data || []);
      } catch (error) {
        console.error('Error fetching saved places:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSavedPlaces();
    }
  }, [user]);

  const getPlaceIcon = (type) => {
    switch (type) {
      case 'restaurant':
        return '🍽️';
      case 'attraction':
        return '🏛️';
      case 'hotel':
        return '🏨';
      case 'cafe':
        return '☕';
      default:
        return '📍';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900">Saved Places</h1>
          <p className="mt-2 text-lg text-gray-600">
            Your favorite places to visit
          </p>
        </div>

        {places.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No saved places yet</h3>
            <p className="mt-1 text-gray-500">
              Save places to see them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <span className="text-2xl">{getPlaceIcon(place.place_type)}</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {place.place_type || 'Place'}
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {place.name}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {place.address}
                          </p>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Saved {new Date(place.created_at).toLocaleDateString()}
                  </div>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-500 text-sm font-medium"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('saved_places')
                          .delete()
                          .eq('id', place.id);

                        if (error) throw error;
                        
                        // Update local state
                        setPlaces(places.filter(p => p.id !== place.id));
                      } catch (error) {
                        console.error('Error removing place:', error);
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
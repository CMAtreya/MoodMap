import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import EmotionDetector from '../components/features/EmotionDetector';

const moods = [
  { label: 'Curious', emoji: '🧠', color: 'bg-indigo-100' },
  { label: 'Adventurous', emoji: '🧗', color: 'bg-orange-100' },
  { label: 'Relaxed', emoji: '🧘', color: 'bg-teal-100' },
  { label: 'Romantic', emoji: '💞', color: 'bg-pink-100' },
  { label: 'Energetic', emoji: '⚡', color: 'bg-yellow-100' },
  { label: 'Social', emoji: '🗣️', color: 'bg-blue-100' },
  { label: 'Family Fun', emoji: '👨‍👩‍👧‍👦', color: 'bg-lime-100' }
];

export default function MoodSelection() {
  const nav = useNavigate();
  const { setMood, itinerary, setItinerary } = useMoodMap(s => ({
    setMood: s.setMood,
    itinerary: s.itinerary,
    setItinerary: s.setItinerary
  }));
  const [showScanner, setShowScanner] = useState(false);

  const handleDetected = (emotion) => {
    setShowScanner(false);
    // Map emotion to MoodMap categories
    const emotionMap = {
      happy: 'Energetic',
      sad: 'Relaxed',
      neutral: 'Curious',
      surprised: 'Adventurous',
      angry: 'Energetic',
      disgusted: 'Curious',
      fearful: 'Relaxed'
    };
    const mappedMood = emotionMap[emotion] || 'Curious';
    setItinerary({ ...itinerary, mood: mappedMood });
    nav('/builder');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 flex flex-col items-center">
      <h2 className="text-3xl font-bold mt-8 text-slate-900">How are you feeling today?</h2>

      {/* Vibe Scanner Button */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => setShowScanner(true)}
        className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        <Camera size={20} className="w-5 h-5" /> Scan My Vibe (AI)
      </motion.button>

      {showScanner && (
        <EmotionDetector
          onDetected={handleDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-8 w-full"
      >
        {moods.map(m => (
          <motion.button
            key={m.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMood(m.label); nav('/time-window'); }}
            className={`p-6 rounded-2xl ${m.color} hover:shadow-md transition-all text-left`}
          >
            <div className="text-5xl mb-2">{m.emoji}</div>
            <div className="font-semibold text-slate-800">{m.label}</div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

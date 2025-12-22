import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { motion } from 'framer-motion';

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
  const setMood = useMoodMap(s => s.setMood);
  return (
    <div className="mx-auto max-w-5xl px-4">
      <h2 className="text-3xl font-bold mt-8 text-slate-900">How are you feeling today?</h2>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-6"
      >
        {moods.map(m => (
          <motion.button
            key={m.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setMood(m.label); nav('/time-window'); }}
            className={`p-6 rounded-2xl ${m.color} hover:shadow-md transition-all`}
          >
            <div className="text-5xl">{m.emoji}</div>
            <div className="mt-2 font-semibold text-slate-800">{m.label}</div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

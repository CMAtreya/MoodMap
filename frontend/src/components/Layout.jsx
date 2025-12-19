import React from 'react';
import { useLocation } from 'react-router-dom';
import { useMoodMap } from '../state/store';
import { motion, AnimatePresence } from 'framer-motion';

// Maps moods/routes to background gradients
const gradients = {
  default: "bg-gradient-to-br from-indigo-50 via-white to-cyan-50",
  "Energetic": "bg-gradient-to-br from-orange-100 via-white to-yellow-100",
  "Relaxed": "bg-gradient-to-br from-teal-50 via-white to-emerald-50",
  "Melancholic": "bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200",
  "Curious": "bg-gradient-to-br from-violet-100 via-white to-fuchsia-100",
  "Romantic": "bg-gradient-to-br from-rose-100 via-white to-pink-100",
  "Nature": "bg-gradient-to-br from-green-100 via-white to-lime-100",
  "Social": "bg-gradient-to-br from-blue-100 via-white to-indigo-100",
};

export default function Layout({ children }) {
  const loc = useLocation();
  const mood = useMoodMap(s => s.mood);
  
  // Determine gradient: Prioritize explicit mood if on relevant pages, else default
  // or specific route gradients could be added here.
  const currentGradient = (loc.pathname === '/' || !mood) 
    ? gradients.default 
    : (gradients[mood] || gradients.default);

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-slate-900">
      {/* Animated Background Layer */}
      <div className="fixed inset-0 -z-10">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentGradient}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`absolute inset-0 ${currentGradient}`}
          />
        </AnimatePresence>
        
        {/* Subtle animated blobs/grain for texture */}
        <div className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none">
            <motion.div 
               animate={{ 
                 x: [0, 100, 0],
                 y: [0, -50, 0],
                 scale: [1, 1.2, 1]
               }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-200 rounded-full blur-[120px]"
            />
             <motion.div 
               animate={{ 
                 x: [0, -100, 0],
                 y: [0, 50, 0],
                 scale: [1, 1.3, 1]
               }}
               transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
               className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[140px]"
            />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

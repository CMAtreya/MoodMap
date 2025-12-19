import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { motion } from 'framer-motion';
import { Clock, Sun, Moon, Coffee, Zap } from 'lucide-react';

const presets = [
  { label: 'Quick Break', hours: 2, icon: Coffee, desc: 'Short & sweet' },
  { label: 'Half Day', hours: 4, icon: Sun, desc: 'Explore a bit' },
  { label: 'Full Day', hours: 8, icon: Zap, desc: 'See it all' },
  { label: 'Evening', hours: 3, icon: Moon, desc: 'Night out' }
];

export default function TimeSelection() {
  const nav = useNavigate();
  const mood = useMoodMap(s => s.mood);
  const setTime = useMoodMap(s => s.setTimeWindow);
  const hours = useMoodMap(s => s.timeWindowHours);
  const startTime = useMoodMap(s => s.startTime);
  const setStartTime = useMoodMap(s => s.setStartTime);
  const [startSuggestion, setStartSuggestion] = useState('');

  useEffect(() => {
    const d = new Date();
    setStartSuggestion(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setStartTime(null);
    } else {
      setStartTime(new Date(val).getTime());
    }
  };

  // Format current start time for input if it exists
  const inputValue = startTime 
    ? new Date(startTime).toISOString().slice(0, 16) 
    : '';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl glass-panel p-8 md:p-12 rounded-[2.5rem]"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">How much time do you have?</h2>
          
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="text-sm font-medium text-slate-600">Start Time</div>
            <div className="flex items-center gap-3 bg-white/60 p-1.5 rounded-full border">
              <button 
                onClick={() => setStartTime(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!startTime ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/50'}`}
              >
                Now
              </button>
              <input 
                type="datetime-local" 
                value={inputValue}
                onChange={handleDateChange}
                className={`bg-transparent text-sm border-none focus:ring-0 px-2 py-1 text-slate-700 ${!startTime ? 'opacity-50' : ''}`}
              />
            </div>
            {!startTime && (
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                Current time: {startSuggestion}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {presets.map(p => {
            const Icon = p.icon;
            const isSelected = hours === p.hours;
            return (
              <button
                key={p.label}
                onClick={() => setTime(p.hours)}
                className={`relative group p-6 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white/50 border-white/40 hover:bg-white text-slate-600 hover:shadow-md'}`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Icon size={24} className={isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'} />
                  <div className="font-semibold">{p.label}</div>
                  <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{p.hours} hours</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white/40 rounded-2xl p-6 mb-10">
           <div className="flex justify-between text-sm font-medium text-slate-600 mb-4">
             <span>Specific Duration</span>
             <span>{hours} hours</span>
           </div>
           <input
            type="range"
            min="1"
            max="12"
            step="0.5"
            value={hours}
            onChange={e => setTime(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>1h</span>
            <span>12h</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button onClick={() => nav('/mood')} className="px-8 py-4 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Back
          </button>
          <button
            onClick={() => nav('/preferences')}
            disabled={!mood}
            className="apple-btn-primary px-12 py-4 text-lg shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Preferences
          </button>
        </div>
      </motion.div>
    </div>
  );
}

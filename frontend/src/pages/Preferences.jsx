import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { motion } from 'framer-motion';
import { ArrowRight, Utensils, History, Leaf, Check } from 'lucide-react';

const CUISINES = [
  { id: 'south_indian', label: 'South Indian', icon: '🥥' },
  { id: 'north_indian', label: 'North Indian', icon: '🥘' },
  { id: 'italian', label: 'Italian', icon: '🍝' },
  { id: 'chinese', label: 'Chinese', icon: '🍜' },
  { id: 'authentic', label: 'Authentic Local', icon: '🏠' },
  { id: 'continental', label: 'Continental', icon: '🥗' },
];

const DIETARY = [
  { id: 'veg', label: 'Pure Veg', icon: '🥬' },
  { id: 'non_veg', label: 'Non-Veg', icon: '🍗' },
  { id: 'any', label: 'No Preference', icon: '🍽️' },
];

export default function Preferences() {
  const nav = useNavigate();
  const setPreferences = useMoodMap(s => s.setPreferences);
  const mood = useMoodMap(s => s.mood);
  
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [dietary, setDietary] = useState('any');
  const [heritageVibe, setHeritageVibe] = useState(false);

  const toggleCuisine = (id) => {
    setSelectedCuisines(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setPreferences({
      cuisines: selectedCuisines,
      dietary,
      heritageVibe,
      diet: dietary === 'veg' ? 'Veg' : dietary === 'non_veg' ? 'Non-Veg' : 'Any',
      heritage: !!heritageVibe
    });
    nav('/generating');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 pb-24 pt-24 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Customize Your {mood} Trip</h1>
          <p className="text-slate-600 mt-3">Pick your vibe and flavors for a tailored journey.</p>
        </div>

        {/* Cuisines */}
        <section className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-slate-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Utensils size={20} className="text-orange-500" />
            Cuisine Preferences
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CUISINES.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCuisine(c.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                  selectedCuisines.includes(c.id)
                    ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-200 shadow-sm'
                    : 'hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className={`text-sm font-semibold ${selectedCuisines.includes(c.id) ? 'text-orange-800' : 'text-slate-700'}`}>
                  {c.label}
                </span>
                {selectedCuisines.includes(c.id) && <Check size={16} className="ml-auto text-orange-600" />}
              </button>
            ))}
          </div>
        </section>

        {/* Dietary & Vibe */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Leaf size={20} className="text-green-500" />
              Dietary
            </h2>
            <div className="space-y-2">
              {DIETARY.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDietary(d.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                    dietary === d.id
                      ? 'bg-green-50 border-green-200 ring-2 ring-green-200 shadow-sm'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-2xl">{d.icon}</span>
                  <span className={`text-sm font-semibold ${dietary === d.id ? 'text-green-800' : 'text-slate-700'}`}>
                    {d.label}
                  </span>
                  {dietary === d.id && <Check size={16} className="ml-auto text-green-600" />}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History size={20} className="text-purple-500" />
              Vibe Check
            </h2>
            <div 
              onClick={() => setHeritageVibe(!heritageVibe)}
              className={`cursor-pointer p-5 rounded-2xl border transition-all h-full flex flex-col justify-center items-center text-center gap-3 ${
                heritageVibe
                  ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-200 shadow-sm'
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="p-4 bg-white rounded-full shadow-sm">
                <span className="text-3xl">🏛️</span>
              </div>
              <div>
                <div className={`font-semibold ${heritageVibe ? 'text-purple-900' : 'text-slate-900'}`}>Heritage & Authentic</div>
                <div className="text-xs text-slate-600 mt-1">Prioritize historic places and old-school legendary eateries.</div>
              </div>
              {heritageVibe && <div className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Selected</div>}
            </div>
          </section>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-semibold text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          Generate My Itinerary <ArrowRight />
        </button>
      </div>
    </div>
  );
}

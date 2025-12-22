import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Star, Home, Share2 } from 'lucide-react';
import { getTripState, completeTrip } from '../lib/trip.js';

export default function TripComplete() {
  const { id } = useParams();
  const nav = useNavigate();
  const [state, setState] = useState(null);
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const s = await getTripState(id);
      if (mounted) setState(s);
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function submit() {
    await completeTrip(id, { rating, tags, notes });
    setDone(true);
  }

  if (!state) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  const visited = state.all.filter(s => s.order < state.trip.currentIndex);
  const remaining = state.all.length - visited.length;
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50 to-purple-100" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto max-w-5xl px-4 py-12"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border">
            <Trophy className="text-amber-500" size={18} /> <span className="text-sm font-semibold">{done ? 'Saved Successfully' : 'Trip Completed'}</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">You did it!</h1>
          <p className="mt-2 text-slate-600">Here’s a quick look at your journey</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-6 border">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl p-4 bg-indigo-50">
                <div className="text-xs text-slate-500">Visited</div>
                <div className="text-2xl font-bold text-indigo-700">{visited.length}</div>
              </div>
              <div className="rounded-xl p-4 bg-purple-50">
                <div className="text-xs text-slate-500">Remaining</div>
                <div className="text-2xl font-bold text-purple-700">{remaining}</div>
              </div>
              <div className="rounded-xl p-4 bg-amber-50">
                <div className="text-xs text-slate-500">Rating</div>
                <div className="text-2xl font-bold text-amber-600">{rating.toFixed(1)}</div>
              </div>
            </div>
            
            <div className="font-semibold mb-3">Visited Places</div>
            <div className="space-y-2">
              {visited.map(s => (
                <div key={s.order} className="p-3 rounded-xl border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">{s.order}</div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.category}</div>
                    </div>
                  </div>
                  <Star size={16} className="text-amber-500" /> 
                </div>
              ))}
              {visited.length === 0 && <div className="text-sm text-slate-500">No places visited yet</div>}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="font-semibold mb-3">Share & Save</div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border">
                <div className="text-xs text-slate-500">Overall Rating</div>
                <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full mt-2" />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border">
                <div className="text-xs text-slate-500 mb-2">What stood out?</div>
                <div className="flex gap-2 flex-wrap">
                  {['Great timing', 'Good variety', 'Perfect mood match', 'Too rushed', 'Too much walking', 'Legend vibes'].map(t => (
                    <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={`px-3 py-1 rounded-full border text-sm ${tags.includes(t) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 rounded-xl border" placeholder="Drop a vibe note..." />
              <button onClick={submit} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg">Save Trip</button>
              <button onClick={() => nav('/')} className="w-full py-3 rounded-xl bg-white border text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"><Home size={18} /> Back Home</button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <Sparkles size={14} /> Built for explorers
        </div>
      </motion.div>
    </div>
  );
}

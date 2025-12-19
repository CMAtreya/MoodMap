import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    return <div className="mx-auto max-w-5xl px-4"><div className="py-12">Loading...</div></div>;
  }
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-10 text-center">
        <div className="text-3xl font-bold">{done ? 'Trip Saved' : 'Trip Complete'}</div>
        <div className="mt-2 text-gray-600">Summary</div>
        <div className="mt-4 p-4 rounded-xl border">
          <div>Planned stops {state.all.length}</div>
          <div>Visited {state.trip.currentIndex - 1}</div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl border">
          <div className="font-semibold">Feedback</div>
          <div className="mt-3">
            <div>Rating</div>
            <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full" />
          </div>
          <div className="mt-3">
            <div className="flex gap-2 flex-wrap">
              {['Great timing', 'Good variety', 'Perfect mood match', 'Too rushed', 'Too much walking', 'Wrong mood'].map(t => (
                <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={`px-3 py-1 rounded-full border ${tags.includes(t) ? 'bg-blue-600 text-white' : ''}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-24 border rounded p-2" placeholder="Optional feedback" />
          </div>
          <div className="mt-4">
            <button onClick={submit} className="px-6 py-2 rounded-lg bg-blue-600 text-white">Save Feedback</button>
          </div>
        </div>
        <div className="p-4 rounded-xl border">
          <div className="font-semibold">Recommendations</div>
          <div className="mt-3 text-sm text-gray-600">Based on this trip, we think you'd love...</div>
          <div className="mt-3 space-y-2">
            {state.all.slice(0, 3).map(s => (
              <div key={s.order} className="p-2 rounded border">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm">{s.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <Link to="/" className="px-6 py-2 rounded-lg border">Plan Another Adventure</Link>
        <Link to="/saved-itineraries" className="px-6 py-2 rounded-lg border">View My History</Link>
      </div>
    </div>
  );
}

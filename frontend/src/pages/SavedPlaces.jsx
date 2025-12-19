import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMoodMap } from '../state/store.js';

export default function SavedPlaces() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const user = useMoodMap(s => s.user);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const r = await axios.get('/api/user/places', { params: { userId: user?.id || null } });
      if (mounted) setItems(r.data || []);
    }
    run();
    return () => { mounted = false; };
  }, [user?.id]);

  const filtered = items.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-6">
        <div className="text-2xl font-semibold">Saved Places</div>
        <div className="mt-3">
          <input value={query} onChange={e => setQuery(e.target.value)} className="w-full border rounded p-2" placeholder="Search by name" />
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {filtered.map(p => (
            <div key={p.id} className="p-4 rounded-xl border">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.category || 'Place'}</div>
              <div className="text-sm">Rating {p.rating || 'N/A'}</div>
              <div className="mt-2">
                <button className="px-3 py-1 rounded border">Add to New Itinerary</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

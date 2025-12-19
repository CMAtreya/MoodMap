import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { startTrip } from '../lib/trip.js';
import { useMoodMap } from '../state/store.js';

export default function SavedItineraries() {
  const [items, setItems] = useState([]);
  const nav = useNavigate();
  const user = useMoodMap(s => s.user);
  useEffect(() => {
    let mounted = true;
    async function run() {
      const r = await axios.get('/api/user/itineraries', { params: { userId: user?.id || null } });
      if (mounted) setItems(r.data || []);
    }
    run();
    return () => { mounted = false; };
  }, [user?.id]);
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-6">
        <div className="text-2xl font-semibold">Saved Itineraries</div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {items.map(it => (
            <div key={it.id} className="p-4 rounded-xl border">
              <div className="font-medium">{it.mood}</div>
              <div className="text-sm text-gray-600">{new Date(it.created_at).toLocaleString()}</div>
              <div className="mt-2 text-sm">{it.time_window_hours} hours</div>
              <div className="mt-3 flex gap-2">
                <Link to={`/itinerary/${it.id}`} className="px-3 py-1 rounded border">View</Link>
                <button
                  onClick={async () => {
                    const trip = await startTrip(it.id, user?.id || null);
                    nav(`/trip/${trip.trip.id}/live`);
                  }}
                  className="px-3 py-1 rounded border"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

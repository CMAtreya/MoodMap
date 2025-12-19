import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMoodMap } from '../state/store.js';

export default function Profile() {
  const [stats, setStats] = useState(null);
  const user = useMoodMap(s => s.user);
  useEffect(() => {
    let mounted = true;
    async function run() {
      const r = await axios.get('/api/user/profile', { params: { userId: user?.id || null } });
      if (mounted) setStats(r.data || {});
    }
    run();
    return () => { mounted = false; };
  }, [user?.id]);
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-6">
        <div className="text-2xl font-semibold">Profile</div>
        {stats ? (
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 border rounded-xl">Trips completed {stats.tripsCompleted}</div>
            <div className="p-4 border rounded-xl">Places visited {stats.placesVisited}</div>
            <div className="p-4 border rounded-xl">Favorite mood {stats.favoriteMood || 'N/A'}</div>
          </div>
        ) : (
          <div className="mt-4">Loading...</div>
        )}
      </div>
    </div>
  );
}

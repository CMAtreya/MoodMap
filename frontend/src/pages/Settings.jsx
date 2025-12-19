import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMoodMap } from '../state/store.js';

export default function Settings() {
  const [s, setS] = useState({ default_radius_km: 5, transport_mode: 'walking' });
  const [busy, setBusy] = useState(false);
  const user = useMoodMap(s => s.user);
  useEffect(() => {
    let mounted = true;
    async function run() {
      const r = await axios.get('/api/user/settings', { params: { userId: user?.id || null } });
      if (mounted) setS(r.data || s);
    }
    run();
    return () => { mounted = false; };
  }, [user?.id]);
  async function save() {
    setBusy(true);
    const r = await axios.post('/api/user/settings', { ...s, userId: user?.id || null });
    setS(r.data || s);
    setBusy(false);
  }
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-6">
        <div className="text-2xl font-semibold">Settings</div>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl">
            <div>Default search radius</div>
            <select value={s.default_radius_km} onChange={e => setS(prev => ({ ...prev, default_radius_km: Number(e.target.value) }))} className="mt-2 border rounded p-2">
              {[2,5,10].map(n => <option key={n} value={n}>{n} km</option>)}
            </select>
          </div>
          <div className="p-4 border rounded-xl">
            <div>Preferred transportation</div>
            <select value={s.transport_mode} onChange={e => setS(prev => ({ ...prev, transport_mode: e.target.value }))} className="mt-2 border rounded p-2">
              {['walking','biking','driving'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button disabled={busy} onClick={save} className="px-6 py-2 rounded-lg bg-blue-600 text-white">Save</button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTripState, advanceTrip, reportCrowd, startTrip } from '../lib/trip.js';
import { haversineKm, travelMinutesForKm } from '../utils/geo.js';

export default function LiveTrip() {
  const { id } = useParams();
  const nav = useNavigate();
  const [state, setState] = useState(null);
  const [pos, setPos] = useState(null);
  const [notifyReady, setNotifyReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const s = await getTripState(id);
        if (mounted) setState(s);
      } catch (e) {
        const started = await startTrip(id, null);
        if (mounted) setState(started);
      }
    }
    load();
    const watch = navigator.geolocation.watchPosition(p => setPos(p.coords));
    return () => {
      navigator.geolocation.clearWatch(watch);
    };
  }, [id]);

  useEffect(() => {
    if (Notification && Notification.permission === 'granted') setNotifyReady(true);
    else if (Notification && Notification.permission !== 'denied') Notification.requestPermission().then(p => setNotifyReady(p === 'granted'));
  }, []);

  const distanceKm = useMemo(() => {
    if (!pos || !state || !state.current) return null;
    return Math.round(haversineKm(pos.latitude, pos.longitude, state.current.lat, state.current.lng) * 100) / 100;
  }, [pos, state]);

  useEffect(() => {
    if (notifyReady && distanceKm !== null && distanceKm < 0.15) {
      new Notification('Approaching next stop', { body: `You are ${Math.round(distanceKm * 1000)}m from ${state.current.name}` });
    }
  }, [notifyReady, distanceKm, state]);

  async function doAction(action) {
    setBusy(true);
    const s = await advanceTrip(id, action);
    setState(s);
    setBusy(false);
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-5xl px-4">
        <div className="py-12">Loading trip...</div>
      </div>
    );
  }
  const current = state.current;
  const next = state.next;
  const travelKm = next && pos ? haversineKm(pos.latitude, pos.longitude, next.lat, next.lng) : null;
  const travelMin = travelKm ? travelMinutesForKm(travelKm, 'walking') : null;
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-6">
        <div className="p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{current?.name} • {current?.category}</div>
            <div className="text-sm text-gray-600">Distance {distanceKm !== null ? `${distanceKm} km` : 'N/A'}</div>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-blue-600 rounded" style={{ width: '50%' }} />
            </div>
            <div className="mt-2 text-sm text-gray-600">Time remaining {current?.durationMinutes ? `${current.durationMinutes} min` : 'N/A'}</div>
          </div>
          <div className="flex gap-3 mt-4">
            <button disabled={busy} onClick={() => doAction('checkout')} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Check Out Early</button>
            <button disabled={busy} onClick={() => doAction('add30')} className="px-4 py-2 rounded-lg border">Add 30 minutes</button>
          </div>
        </div>
      </div>
      <div className="py-2">
        <div className="p-4 rounded-xl border">
          <div className="font-semibold">Next: {next?.name || 'None'}</div>
          <div className="text-sm text-gray-600">{travelKm ? `${Math.round(travelKm * 10) / 10} km • ${travelMin} min` : 'N/A'}</div>
          <div className="mt-2">
            <a
              className="px-4 py-2 rounded-lg bg-green-600 text-white inline-block"
              href={next ? `https://www.google.com/maps/dir/?api=1&destination=${next.lat},${next.lng}` : '#'}
              target="_blank"
              rel="noreferrer"
            >
              Navigate
            </a>
          </div>
        </div>
      </div>
      <div className="py-4">
        <div className="p-4 rounded-xl border">
          <div className="font-semibold">Itinerary Overview</div>
          <div className="mt-3 space-y-2">
            {state.all.map(s => (
              <div key={s.order} className={`p-2 rounded border ${s.order < state.trip.currentIndex ? 'bg-green-50' : s.order === state.trip.currentIndex ? 'bg-blue-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>{s.order}. {s.name}</div>
                  <div className="text-sm">{s.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button disabled={busy} onClick={() => doAction('skip')} className="px-4 py-2 rounded-full bg-gray-800 text-white">Skip to Next Stop</button>
        <button disabled={busy} onClick={() => doAction('end')} className="px-4 py-2 rounded-full bg-red-600 text-white">End Trip Early</button>
        <button onClick={async () => { await reportCrowd(id, current?.order || 1, 'High'); }} className="px-4 py-2 rounded-full bg-yellow-500 text-white">Report Crowd</button>
        <Link to={`/trip/${id}/complete`} className="px-4 py-2 rounded-full bg-blue-600 text-white text-center">Complete Trip</Link>
      </div>
    </div>
  );
}

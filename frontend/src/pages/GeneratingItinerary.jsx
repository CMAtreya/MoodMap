import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { generateItinerary } from '../lib/api.js';

const messages = [
  '📍 Found your location',
  '🔍 Checking nearby places',
  '🎭 Filtering by mood',
  '🤖 AI is selecting perfect spots',
  '🗺️ Optimizing your route',
  '✨ Adding finishing touches'
];

export default function GeneratingItinerary() {
  const nav = useNavigate();
  const mood = useMoodMap(s => s.mood);
  const hours = useMoodMap(s => s.timeWindowHours);
  const startTime = useMoodMap(s => s.startTime);
  const preferences = useMoodMap(s => s.preferences);
  const setItinerary = useMoodMap(s => s.setItinerary);
  const user = useMoodMap(s => s.user);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mood) {
      nav('/mood');
      return;
    }

    let mounted = true;
    navigator.geolocation.getCurrentPosition(async pos => {
      for (let i = 0; i < messages.length; i++) {
        setStep(i);
        await new Promise(r => setTimeout(r, 500));
      }
      try {
        const it = await generateItinerary(mood, hours, pos.coords, user?.id || null, startTime, preferences);
        if (!mounted) return;
        setItinerary(it);
        nav('/builder');
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || 'Failed to generate itinerary';
        setError(msg);
      }
    }, () => setError('Location not available'));
    return () => { mounted = false; };
  }, [mood, hours, startTime, nav, setItinerary]);

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="py-16 text-center">
        <div className="text-2xl font-semibold">Generating your itinerary</div>
        <div className="mt-6 h-24 flex items-center justify-center">
          <div className="animate-pulse text-lg">{messages[step]}</div>
        </div>
        {error && (
          <div className="mt-6">
            <div className="text-red-600">{error}</div>
            <button onClick={() => nav('/time-window')} className="mt-3 px-4 py-2 rounded-lg border">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}

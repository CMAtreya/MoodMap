import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MapPinOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-red-50 p-6 rounded-full text-red-500 mb-6"
      >
        <MapPinOff size={64} />
      </motion.div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-lg text-slate-600 mb-8 max-w-md">
        Looks like you've wandered off the map. This location doesn't exist in our itinerary.
      </p>
      <Button size="lg" onClick={() => nav('/')}>
        Return Home
      </Button>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { motion } from 'framer-motion';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!supabase) return setError('System configuration error: Supabase client not initialized');
    
    setBusy(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    
    if (err) {
      if (err.message === 'Invalid login credentials') {
        return setError('Invalid email or password. Please try again.');
      }
      return setError(err.message || 'Login failed');
    }
    
    if (data?.user) {
      nav('/');
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass-panel p-8 rounded-[2rem]"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in with MoodMap</h1>
          <p className="text-sm text-gray-500 mt-2">Enter your credentials to continue</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="apple-input"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="apple-input"
              required
            />
          </div>
          
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}
          
          <button type="submit" disabled={busy} className="apple-btn-primary disabled:opacity-50">
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          New here? <Link to="/signup" className="text-blue-600 hover:underline">Create an account</Link>
        </div>
      </motion.div>
    </div>
  );
}

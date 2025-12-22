import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError('');
    if (!supabase) return setError('System configuration error');
    
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (err) throw err;
      
      // Get the redirect URL from the URL params or default to '/'
      const params = new URLSearchParams(window.location.search);
      const from = params.get('redirectTo') || '/';
      nav(from);
    } catch (err) {
      setError(err.message.includes('credentials') 
        ? 'Invalid email or password. Try again or click "Forgot Password"' 
        : err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuthLogin(provider) {
    setBusy(true);
    setError('');
    
    try {
      // Get the redirect URL from the URL params or default to '/'
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirectTo') || '/';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setError(`Couldn't sign in with ${provider}. Please try again.`);
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) return setError('Please enter your email first');
    
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setError('Check your email for a password reset link!');
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-2">
            MoodMap
          </h1>
          <p className="text-gray-600">Your journey, your mood, your way</p>
        </div>
        
        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back! 👋</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to continue your journey</p>
            
            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled={busy}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faGoogle} className="text-red-500" />
                Google
              </button>
              <button
                onClick={() => handleOAuthLogin('github')}
                disabled={busy}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faGithub} className="text-gray-800" />
                GitHub
              </button>
            </div>
            
            <div className="flex items-center my-6">
              <div className="border-t border-gray-200 flex-grow"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="border-t border-gray-200 flex-grow"></div>
            </div>
            
            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                  disabled={busy}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-purple-600 hover:text-purple-500 focus:outline-none"
                  disabled={busy}
                >
                  Forgot password?
                </button>
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={busy}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ${busy ? 'opacity-70 cursor-not-allowed' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {busy ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="relative">
                      Sign In
                      <span 
                        className={`absolute bottom-0 left-0 w-full h-0.5 bg-white transition-all duration-300 ${isHovered ? 'scale-x-100' : 'scale-x-0'}`}
                      />
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-gray-50 px-8 py-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}
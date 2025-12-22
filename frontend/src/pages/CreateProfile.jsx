import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store.js';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faSpinner, faCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';

// Dynamic gradient backgrounds
const backgroundGradients = [
  'bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500',
  'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
  'bg-gradient-to-br from-green-400 to-blue-500',
  'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500',
  'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
];

const interests = [
  { id: 1, name: 'Adventure', emoji: '🏕️' },
  { id: 2, name: 'Foodie', emoji: '🍔' },
  { id: 3, name: 'Photography', emoji: '📸' },
  { id: 4, name: 'Music', emoji: '🎵' },
  { id: 5, name: 'Art', emoji: '🎨' },
  { id: 6, name: 'Sports', emoji: '⚽' },
  { id: 7, name: 'Gaming', emoji: '🎮' },
  { id: 8, name: 'Fitness', emoji: '💪' },
];

export default function CreateProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useMoodMap();
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    bio: '',
    interests: [],
    avatar: null,
    avatarPreview: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);

  // Check if we're in edit mode and load existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile && !error) {
          setIsEditing(true);
          setFormData({
            username: profile.username || '',
            fullName: profile.full_name || '',
            bio: profile.bio || '',
            interests: profile.interests || [],
            avatar: null,
            avatarPreview: profile.avatar_url || null,
          });
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file, avatarPreview: URL.createObjectURL(file) });
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest.id)
        ? prev.interests.filter(id => id !== interest.id)
        : [...prev.interests, interest.id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload avatar if a new one was selected
      let avatarUrl = formData.avatarPreview;
      
      if (formData.avatar) {
        const fileExt = formData.avatar.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData.avatar, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = publicUrl;
      }

      // Save profile to database
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          full_name: formData.fullName,
          bio: formData.bio,
          interests: formData.interests,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          full_name: formData.fullName,
          avatar_url: avatarUrl,
          username: formData.username,
          bio: formData.bio
        }
      });

      if (updateError) throw updateError;

      // Update local state
      setUser({ 
        ...user, 
        user_metadata: { 
          ...user.user_metadata, 
          full_name: formData.fullName,
          avatar_url: avatarUrl,
          username: formData.username,
          bio: formData.bio
        },
        profile: profile // Add the full profile to the user object
      });

      // Show success message and redirect
      alert(isEditing ? 'Profile updated successfully!' : 'Profile created successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Failed to save profile: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">Let's get to know you! 👋</h2>
            <p className="text-center text-gray-300">First, tell us your name</p>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s+/g, '')})}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
                <span className="absolute right-3 top-3.5 text-gray-400 text-sm">@{formData.username || 'username'}</span>
              </div>
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">Show your style! 🎨</h2>
            <p className="text-center text-gray-300">Add a profile picture</p>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                  {formData.avatarPreview ? (
                    <img 
                      src={formData.avatarPreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">👤</div>
                  )}
                </div>
                <label 
                  className="absolute -bottom-2 -right-2 bg-white text-purple-600 p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  title="Upload photo"
                >
                  <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-sm text-gray-300 text-center">
                Or skip for now, you can add one later!
              </p>
            </div>
            
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-3">Tell us about yourself</h3>
              <textarea
                placeholder="A short bio (max 150 characters)"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                maxLength={150}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[100px]"
              />
              <p className="text-xs text-right text-gray-400 mt-1">
                {formData.bio.length}/150
              </p>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">What are you into? 🎯</h2>
            <p className="text-center text-gray-300">Select at least 3 interests</p>
            
            <div className="grid grid-cols-2 gap-3">
              {interests.map((interest) => (
                <motion.button
                  key={interest.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(interest)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.interests.includes(interest.id)
                      ? 'bg-white/20 border-white/50'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-2xl">{interest.emoji}</span>
                    <span>{interest.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {formData.interests.length > 0 && (
              <div className="pt-2">
                <p className="text-sm text-center text-gray-300">
                  Selected: {formData.interests.length}/8
                </p>
              </div>
            )}
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {backgroundGradients.map((gradient, index) => (
            index === currentBg && (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className={`absolute inset-0 ${gradient} transition-colors duration-1000`}
              />
            )
          ))}
        </AnimatePresence>
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <button
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                  currentStep >= i
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white'
                }`}
              >
                {i < currentStep ? '✓' : i}
              </button>
              {i < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    currentStep > i ? 'bg-white' : 'bg-white/20'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="glass-panel p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && (!formData.fullName || !formData.username)) ||
                  (currentStep === 2 && !formData.bio)
                }
                className="px-6 py-2.5 bg-white text-purple-600 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
              >
                <span>Next</span>
                <FontAwesomeIcon icon={faArrowRight} className="h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || formData.interests.length < 3}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  isSubmitting || formData.interests.length < 3
                    ? 'bg-white/50 text-purple-600/50 cursor-not-allowed'
                    : 'bg-white text-purple-600 hover:bg-opacity-90'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    {currentStep === 3 ? 'Saving...' : 'Loading...'}
                  </>
                ) : currentStep === 3 ? (
                  <>
                    {isEditing ? 'Update Profile' : 'Create Profile'}
                    <FontAwesomeIcon icon={faCheck} />
                  </>
                ) : (
                  <>
                    Continue
                    <FontAwesomeIcon icon={faArrowRight} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMoodMap } from '../state/store';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useMoodMap();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-48 bg-gradient-to-r from-purple-500 to-indigo-600">
            <div className="absolute -bottom-16 left-6">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-4xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-6">
              <button
                onClick={() => navigate('/profile/edit')}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <span>Edit Profile</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 px-6 pb-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.full_name || 'Anonymous User'}
              </h1>
              <p className="text-purple-600">@{profile?.username || 'username'}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">About</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {profile?.bio || 'No bio provided.'}
              </p>
            </div>

            {profile?.interests?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interestId) => {
                    const interest = interests.find((i) => i.id === interestId);
                    return (
                      interest && (
                        <span
                          key={interest.id}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          {interest.emoji} {interest.name}
                        </span>
                      )
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Member since</p>
                  <p className="text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
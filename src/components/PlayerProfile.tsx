import { useEffect, useState } from 'react';

import { getUserProfile } from '../services/userService';
import type { PlayerProfile as PlayerProfileData } from '../types';

interface PlayerProfileProps {
  userId: string;
  onClose: () => void;
}

export const PlayerProfile = ({ userId, onClose }: PlayerProfileProps) => {
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const playerProfile = await getUserProfile(userId);
        setProfile(playerProfile);
      } catch (error) {
        console.error('Failed to fetch player profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-600">Player profile not found.</p>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{profile.user.name}</h2>

      <div className="mb-6">
        <p className="text-gray-700">
          <span className="font-semibold">Email:</span> {profile.user.email}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Games Attended:</span>{' '}
          {profile.user.gamesAttended?.length || 0}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Games</h3>
        {profile.gamesAttendedDetails && profile.gamesAttendedDetails.length > 0 ? (
          <div className="space-y-2">
            {profile.gamesAttendedDetails.slice(0, 5).map((game) => (
              <div key={game.id} className="bg-gray-50 p-3 rounded">
                <p className="font-semibold">{game.sportType}</p>
                <p className="text-sm text-gray-600">
                  {new Date(game.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No games attended yet.</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
      >
        Close
      </button>
    </div>
  );
};

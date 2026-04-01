import { useState } from 'react';

import type { Game } from '../types';

interface StartGameFormProps {
  userId: string;
  onSubmit: (gameData: Omit<Game, 'id' | 'createdAt' | 'players'>) => Promise<void>;
  onCancel: () => void;
}

const SPORTS_TYPES = ['Basketball', 'Soccer', 'Tennis', 'Volleyball', 'Baseball'];
const COMPETITIVE_LEVELS = ['casual', 'intermediate', 'competitive'] as const;

export const StartGameForm = ({ userId, onSubmit, onCancel }: StartGameFormProps) => {
  const [sportType, setSportType] = useState('Basketball');
  const [competitiveLevel, setCompetitiveLevel] = useState<
    'casual' | 'intermediate' | 'competitive'
  >('casual');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Northwestern coordinates as default
      const gameData: Omit<Game, 'id' | 'createdAt' | 'players'> = {
        sportType,
        location: {
          latitude: 42.0534,
          longitude: -87.675,
          address: address || 'Northwestern University, Evanston, IL',
        },
        competitiveLevel,
        maxPlayers,
        startTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        createdBy: userId,
        description,
      };

      await onSubmit(gameData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Start a Game</h2>

      <div>
        <label htmlFor="sport-type" className="block text-gray-700 font-semibold mb-2">
          Sport Type
        </label>
        <select
          id="sport-type"
          value={sportType}
          onChange={(e) => setSportType(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2"
        >
          {SPORTS_TYPES.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="competitive-level"
          className="block text-gray-700 font-semibold mb-2"
        >
          Competitive Level
        </label>
        <select
          id="competitive-level"
          value={competitiveLevel}
          onChange={(e) =>
            setCompetitiveLevel(
              e.target.value as 'casual' | 'intermediate' | 'competitive',
            )
          }
          className="w-full border border-gray-300 rounded px-4 py-2"
        >
          {COMPETITIVE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="max-players" className="block text-gray-700 font-semibold mb-2">
          Max Players
        </label>
        <input
          id="max-players"
          type="number"
          min="2"
          max="20"
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-gray-700 font-semibold mb-2">
          Location
        </label>
        <input
          id="location"
          type="text"
          placeholder="Enter location or address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your game"
          className="w-full border border-gray-300 rounded px-4 py-2"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

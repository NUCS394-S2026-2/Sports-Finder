import { useState } from 'react';

import { logout } from '../services/authService';
import { createGame, joinGame } from '../services/gameService';
import { createOrUpdateUser, recordGameAttendance } from '../services/userService';
import type { Game } from '../types';
import { GameCard } from './GameCard';
import { GameMap } from './GameMap';
import { PlayerProfile } from './PlayerProfile';
import { StartGameForm } from './StartGameForm';

interface MainScreenProps {
  userId: string;
  userName: string;
}

type ViewState = 'map' | 'gameDetail' | 'startGame' | 'playerProfile';

export const MainScreen = ({ userId, userName }: MainScreenProps) => {
  const [viewState, setViewState] = useState<ViewState>('map');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setViewState('gameDetail');
  };

  const handleStartGame = async (
    gameData: Omit<Game, 'id' | 'createdAt' | 'players'>,
  ) => {
    try {
      // Create or update user first
      await createOrUpdateUser(userId, {
        id: userId,
        name: userName,
        email: '', // Email would come from Firebase Auth
      });

      await createGame(gameData);
      setViewState('map');
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleJoinGame = async () => {
    if (!selectedGame) return;

    try {
      await joinGame(selectedGame.id, userId);
      await recordGameAttendance(userId, selectedGame.id);
      setViewState('map');
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const handleGetDirections = () => {
    if (!selectedGame) return;

    // Open Google Maps directions
    const { latitude, longitude } = selectedGame.location;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');

    // Record attendance
    recordGameAttendance(userId, selectedGame.id);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sports-Finder</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {userName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        {viewState === 'map' && (
          <div className="space-y-4">
            <GameMap onGameSelect={handleGameSelect} />
            <button
              onClick={() => setViewState('startGame')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Start Game
            </button>
          </div>
        )}

        {viewState === 'gameDetail' && selectedGame && (
          <div className="space-y-4">
            <button
              onClick={() => setViewState('map')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              ← Back to Map
            </button>
            <GameCard
              game={selectedGame}
              onPlayerClick={(playerId) => {
                setSelectedPlayerId(playerId);
                setViewState('playerProfile');
              }}
              onGetDirections={handleGetDirections}
              onJoin={handleJoinGame}
            />
          </div>
        )}

        {viewState === 'startGame' && (
          <div className="space-y-4">
            <button
              onClick={() => setViewState('map')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              ← Back to Map
            </button>
            <StartGameForm
              userId={userId}
              onSubmit={handleStartGame}
              onCancel={() => setViewState('map')}
            />
          </div>
        )}

        {viewState === 'playerProfile' && selectedPlayerId && (
          <div className="space-y-4">
            <button
              onClick={() => setViewState('gameDetail')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              ← Back to Game
            </button>
            <PlayerProfile
              userId={selectedPlayerId}
              onClose={() => setViewState('gameDetail')}
            />
          </div>
        )}
      </main>
    </div>
  );
};

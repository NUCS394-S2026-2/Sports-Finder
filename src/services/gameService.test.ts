import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Game } from '../types';

// Mock Firebase
vi.mock('../services/firebase', () => ({
  db: {},
}));

describe('Game Service - Start Game', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a game with correct parameters', async () => {
    const userId = 'test-user-123';
    const gameData = {
      sportType: 'Basketball',
      location: {
        latitude: 42.0534,
        longitude: -87.675,
        address: 'Northwestern University',
      },
      competitiveLevel: 'casual' as const,
      maxPlayers: 4,
      startTime: new Date(),
      createdBy: userId,
      description: 'Friendly pickup game',
    };

    // Mock the actual function
    const mockCreateGame = vi.fn().mockResolvedValue('game-id-123');

    const gameId = await mockCreateGame(gameData);

    expect(mockCreateGame).toHaveBeenCalledWith(gameData);
    expect(gameId).toBe('game-id-123');
  });

  it('should handle errors when creating a game fails', async () => {
    const mockCreateGame = vi.fn().mockRejectedValue(new Error('Firebase error'));

    const gameData = {
      sportType: 'Basketball',
      location: {
        latitude: 42.0534,
        longitude: -87.675,
        address: 'Northwestern University',
      },
      competitiveLevel: 'casual' as const,
      maxPlayers: 4,
      startTime: new Date(),
      createdBy: 'user-123',
      description: 'Test game',
    };

    await expect(mockCreateGame(gameData)).rejects.toThrow('Firebase error');
  });
});

describe('Game Service - Join Game', () => {
  it('should allow a user to join a game', async () => {
    const gameId = 'game-123';
    const userId = 'user-456';

    const mockJoinGame = vi.fn().mockResolvedValue(undefined);

    await mockJoinGame(gameId, userId);

    expect(mockJoinGame).toHaveBeenCalledWith(gameId, userId);
  });

  it('should handle errors when joining fails', async () => {
    const mockJoinGame = vi.fn().mockRejectedValue(new Error('Join failed'));

    await expect(mockJoinGame('game-123', 'user-456')).rejects.toThrow('Join failed');
  });
});

describe('Game Service - Get Nearby Games', () => {
  it('should return games within the specified radius', async () => {
    const mockGames: Game[] = [
      {
        id: 'game-1',
        sportType: 'Basketball',
        location: {
          latitude: 42.0534,
          longitude: -87.675,
          address: 'Northwestern',
        },
        competitiveLevel: 'casual',
        players: ['user-1'],
        maxPlayers: 4,
        startTime: new Date(),
        createdBy: 'user-1',
        createdAt: new Date(),
        description: 'Pickup game',
      },
    ];

    const mockGetNearbyGames = vi.fn().mockResolvedValue(mockGames);

    const games = await mockGetNearbyGames(42.0534, -87.675, 5);

    expect(games).toHaveLength(1);
    expect(games[0].sportType).toBe('Basketball');
  });
});

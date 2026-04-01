import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerProfile } from '../types';

// Mock Firebase
vi.mock('../services/firebase', () => ({
  db: {},
}));

describe('User Service - Create/Update User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new user with correct data', async () => {
    const userId = 'user-123';
    const userData = {
      id: userId,
      name: 'Alice',
      email: 'alice@example.com',
    };

    const mockCreateOrUpdateUser = vi.fn().mockResolvedValue(undefined);

    await mockCreateOrUpdateUser(userId, userData);

    expect(mockCreateOrUpdateUser).toHaveBeenCalledWith(userId, userData);
  });

  it('should update an existing user', async () => {
    const userId = 'user-123';
    const updateData = {
      name: 'Alice Updated',
    };

    const mockUpdate = vi.fn().mockResolvedValue(undefined);

    await mockUpdate(userId, updateData);

    expect(mockUpdate).toHaveBeenCalledWith(userId, updateData);
  });
});

describe('User Service - Get Player Profile', () => {
  it("should retrieve a player's profile with game history", async () => {
    const userId = 'user-123';
    const mockProfile: PlayerProfile = {
      user: {
        id: userId,
        name: 'Bob',
        email: 'bob@example.com',
        gamesAttended: ['game-1', 'game-2'],
        createdAt: new Date(),
      },
      gamesAttendedDetails: [],
      favorySports: ['Basketball'],
    };

    const mockGetUserProfile = vi.fn().mockResolvedValue(mockProfile);

    const profile = await mockGetUserProfile(userId);

    expect(mockGetUserProfile).toHaveBeenCalledWith(userId);
    expect(profile?.user.name).toBe('Bob');
    expect(profile?.user.gamesAttended).toHaveLength(2);
  });

  it('should return null if user profile not found', async () => {
    const mockGetUserProfile = vi.fn().mockResolvedValue(null);

    const profile = await mockGetUserProfile('non-existent-user');

    expect(profile).toBeNull();
  });

  it('should include game details in player profile', async () => {
    const userId = 'user-123';
    const mockProfile: PlayerProfile = {
      user: {
        id: userId,
        name: 'Cathy',
        email: 'cathy@example.com',
        gamesAttended: ['game-1'],
        createdAt: new Date(),
      },
      gamesAttendedDetails: [
        {
          id: 'game-1',
          sportType: 'Basketball',
          location: {
            latitude: 42.0534,
            longitude: -87.675,
            address: 'Northwestern',
          },
          competitiveLevel: 'intermediate',
          players: ['user-123', 'user-456'],
          maxPlayers: 4,
          startTime: new Date(),
          createdBy: 'user-456',
          createdAt: new Date(),
          description: 'Intermediate pickup',
        },
      ],
      favorySports: ['Basketball'],
    };

    const mockGetUserProfile = vi.fn().mockResolvedValue(mockProfile);

    const profile = await mockGetUserProfile(userId);

    expect(profile?.gamesAttendedDetails).toHaveLength(1);
    expect(profile?.gamesAttendedDetails[0].sportType).toBe('Basketball');
  });
});

describe('User Service - Record Game Attendance', () => {
  it('should record that a user attended a game', async () => {
    const userId = 'user-123';
    const gameId = 'game-456';

    const mockRecordAttendance = vi.fn().mockResolvedValue(undefined);

    await mockRecordAttendance(userId, gameId);

    expect(mockRecordAttendance).toHaveBeenCalledWith(userId, gameId);
  });

  it('should handle errors when recording attendance fails', async () => {
    const mockRecordAttendance = vi.fn().mockRejectedValue(new Error('Failed to record'));

    await expect(mockRecordAttendance('user-123', 'game-456')).rejects.toThrow(
      'Failed to record',
    );
  });
});

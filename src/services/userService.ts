import type { PlayerProfile, User } from '../types';

const users: Record<string, User> = {};

export const createOrUpdateUser = async (
  userId: string,
  userData: Partial<User>,
): Promise<void> => {
  const existing = users[userId];
  if (existing) {
    users[userId] = {
      ...existing,
      ...userData,
      gamesAttended: existing.gamesAttended || [],
      createdAt: existing.createdAt,
    };
  } else {
    users[userId] = {
      id: userId,
      name: userData.name || 'Unknown',
      email: userData.email || '',
      gamesAttended: userData.gamesAttended ?? [],
      createdAt: new Date(),
    };
  }
};

export const getUserProfile = async (userId: string): Promise<PlayerProfile | null> => {
  const user = users[userId];
  if (!user) return null;

  // Ideally fetch game details from game service if needed
  return { user, gamesAttendedDetails: [], favorySports: [] };
};

export const recordGameAttendance = async (
  userId: string,
  gameId: string,
): Promise<void> => {
  if (!users[userId]) {
    throw new Error('User not found');
  }
  if (!users[userId].gamesAttended.includes(gameId)) {
    users[userId].gamesAttended.push(gameId);
  }
};

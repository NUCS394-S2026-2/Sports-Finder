// Firebase removed: using local in-memory storage for both auth and data.

import type { User } from '../types';

const defaultUser: User = {
  id: 'default-user',
  name: 'Default User',
  email: 'default@example.com',
  gamesAttended: [],
  createdAt: new Date(),
};

export const auth: { currentUser: User | null } = {
  currentUser: defaultUser,
};

export const db = {
  initialized: true,
};

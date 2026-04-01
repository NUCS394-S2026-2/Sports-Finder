import type { User } from '../types';
import { auth } from './firebase';

export const signInWithGoogle = async (): Promise<User> => {
  const user: User = {
    id: 'local-user-1',
    name: 'Local User',
    email: 'localuser@example.com',
    gamesAttended: [],
    createdAt: new Date(),
  };
  auth.currentUser = user;
  return user;
};

export const logout = async (): Promise<void> => {
  auth.currentUser = null;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

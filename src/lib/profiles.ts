import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ProfileData } from '../types';

const usersCol = collection(db, 'users');

/**
 * Get or create a user profile
 */
export async function getUserProfile(userId: string): Promise<ProfileData | null> {
  try {
    const userRef = doc(usersCol, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as ProfileData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or update user profile
 */
export async function saveUserProfile(profile: ProfileData): Promise<void> {
  try {
    const userRef = doc(usersCol, profile.userId);
    await setDoc(
      userRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

/**
 * Update specific fields in user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<ProfileData>,
): Promise<void> {
  try {
    const userRef = doc(usersCol, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Delete user profile
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  try {
    const userRef = doc(usersCol, userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}

/**
 * Initialize a new user profile with defaults
 */
export function initializeUserProfile(
  userId: string,
  displayName: string = '',
): ProfileData {
  return {
    userId,
    displayName: displayName || userId.split('@')[0] || 'User',
    bio: '',
    gamesJoined: [],
    gamesCreated: [],
    favoriteSports: [],
    notificationPreferences: {
      gameUpdates: true,
      gameCancelled: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

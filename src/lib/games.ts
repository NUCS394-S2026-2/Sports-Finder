import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase';
import type { GameDraft, PickupGame } from '../types';

const gamesCollection = collection(db, 'games');

export async function fetchGames(): Promise<PickupGame[]> {
  const q = query(gamesCollection, orderBy('startTime', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<PickupGame, 'id'>),
  }));
}

export async function createGame(draft: GameDraft): Promise<void> {
  await addDoc(gamesCollection, {
    sport: draft.sport.trim() || 'Basketball',
    location: draft.location.trim() || 'New local venue',
    startTime: draft.startTime,
    capacity: Math.max(2, Math.round(draft.capacity)),
    spotsFilled: 0,
    organizer: draft.organizer.trim() || 'Community host',
    note: draft.note.trim() || 'Bring water and arrive a few minutes early.',
    skillLevel: draft.skillLevel,
    ageRange: draft.ageRange,
    gender: draft.gender,
  });
}

export async function joinGame(gameId: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);

  await updateDoc(gameRef, {
    spotsFilled: increment(1),
  });
}

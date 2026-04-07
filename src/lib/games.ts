import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase';
import type { GameDraft, PickupGame } from '../types';
import { toLocalDateTimeValue } from './datetime';

const gamesCollection = collection(db, 'games');

type FirestoreGameDoc = Partial<Omit<PickupGame, 'id' | 'startTime'>> & {
  startTime?: Timestamp | string;
  time?: Timestamp | string;
};

function parseStartTime(value: FirestoreGameDoc['startTime'] | FirestoreGameDoc['time']) {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return toLocalDateTimeValue(value.toDate());
  }

  if (typeof value === 'string') {
    return value;
  }

  return toLocalDateTimeValue(new Date(Date.now() + 90 * 60 * 1000));
}

function toPickupGame(docId: string, data: FirestoreGameDoc): PickupGame {
  return {
    id: docId,
    sport: data.sport?.trim() || 'Basketball',
    location: data.location?.trim() || 'New local venue',
    startTime: parseStartTime(data.startTime ?? data.time),
    capacity: Math.max(2, Math.round(data.capacity ?? 10)),
    spotsFilled: Math.max(0, Math.round(data.spotsFilled ?? 0)),
    organizer: data.organizer?.trim() || 'Community host',
    note: data.note?.trim() || 'Bring water and arrive a few minutes early.',
    skillLevel: data.skillLevel ?? 'Beginner',
    ageRange: data.ageRange ?? '25-34',
    gender: data.gender ?? 'Open',
  };
}

export async function fetchGames(): Promise<PickupGame[]> {
  const snapshot = await getDocs(gamesCollection);

  const games = snapshot.docs.map((docSnapshot) =>
    toPickupGame(docSnapshot.id, docSnapshot.data() as FirestoreGameDoc),
  );

  games.sort((a, b) => {
    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return 0;
    }

    if (Number.isNaN(aTime)) {
      return 1;
    }

    if (Number.isNaN(bTime)) {
      return -1;
    }

    return bTime - aTime;
  });

  return games;
}

export async function createGame(draft: GameDraft): Promise<void> {
  const startDate = new Date(draft.startTime);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error('Invalid startTime value');
  }

  await addDoc(gamesCollection, {
    sport: draft.sport.trim() || 'Basketball',
    location: draft.location.trim() || 'New local venue',
    startTime: Timestamp.fromDate(startDate),
    capacity: Math.max(2, Math.round(draft.capacity)),
    spotsFilled: 0,
    organizer: draft.organizer.trim() || 'Community host',
    note: draft.note.trim() || 'Bring water and arrive a few minutes early.',
    skillLevel: draft.skillLevel,
    ageRange: draft.ageRange,
    gender: draft.gender,
    createdAt: serverTimestamp(),
  });
}

export async function joinGame(gameId: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);

  await updateDoc(gameRef, {
    spotsFilled: increment(1),
  });
}

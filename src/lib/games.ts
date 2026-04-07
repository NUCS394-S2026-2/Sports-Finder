import {
  addDoc,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../firebase';
import type { GameDraft, PickupGame } from '../types';
import { toLocalDateTimeValue } from './datetime';

const gamesCollection = collection(db, 'games');
const allowedSports = ['Tennis', 'Soccer', 'Ultimate Frisbee'] as const;
const allowedGenders = ['All', 'Women', 'Men'] as const;

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

function parseSport(value: unknown): PickupGame['sport'] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (allowedSports.includes(trimmed as (typeof allowedSports)[number])) {
      return trimmed as PickupGame['sport'];
    }
  }

  return 'Tennis';
}

function parseGender(value: unknown): PickupGame['gender'] {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === 'Open' || trimmed === 'Mixed') {
      return 'All';
    }

    if (allowedGenders.includes(trimmed as (typeof allowedGenders)[number])) {
      return trimmed as PickupGame['gender'];
    }
  }

  return 'All';
}

function toPickupGame(docId: string, data: FirestoreGameDoc): PickupGame {
  const rawAttendees = Array.isArray(data.attendees) ? data.attendees : [];
  const attendees = rawAttendees.filter(
    (value): value is string => typeof value === 'string',
  );

  return {
    id: docId,
    sport: parseSport(data.sport),
    location: data.location?.trim() || 'New local venue',
    startTime: parseStartTime(data.startTime ?? data.time),
    capacity: Math.max(2, Math.round(data.capacity ?? 10)),
    spotsFilled: Math.max(0, Math.round(data.spotsFilled ?? 0)),
    organizer: data.organizer?.trim() || 'Community host',
    note: data.note?.trim() || 'Bring water and arrive a few minutes early.',
    skillLevel: data.skillLevel ?? 'Beginner',
    ageRange: data.ageRange ?? '25-34',
    gender: parseGender(data.gender),
    attendees,
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
  if (!draft.sport) {
    throw new Error('Sport is required');
  }

  if (draft.capacity === '' || draft.capacity < 2 || draft.capacity > 30) {
    throw new Error('Capacity must be between 2 and 30');
  }

  const startDate = new Date(draft.startTime);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error('Invalid startTime value');
  }

  await addDoc(gamesCollection, {
    sport: draft.sport.trim() || 'Tennis',
    location: draft.location.trim() || 'New local venue',
    startTime: Timestamp.fromDate(startDate),
    capacity: Math.max(2, Math.round(draft.capacity)),
    spotsFilled: 0,
    organizer: draft.organizer.trim() || 'Community host',
    note: draft.note.trim() || 'Bring water and arrive a few minutes early.',
    skillLevel: draft.skillLevel,
    ageRange: draft.ageRange,
    gender: draft.gender,
    attendees: [],
    createdAt: serverTimestamp(),
  });
}

export async function joinGame(gameId: string, attendeeName: string): Promise<void> {
  const gameRef = doc(db, 'games', gameId);

  await runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }

    const data = gameDoc.data() as {
      capacity?: number;
      spotsFilled?: number;
      attendees?: unknown[];
    };

    const capacity = Math.max(2, Math.round(data.capacity ?? 10));
    const spotsFilled = Math.max(0, Math.round(data.spotsFilled ?? 0));
    const attendees = (Array.isArray(data.attendees) ? data.attendees : []).filter(
      (value): value is string => typeof value === 'string',
    );

    if (attendees.includes(attendeeName)) {
      return;
    }

    if (spotsFilled >= capacity) {
      throw new Error('Game is full');
    }

    transaction.update(gameRef, {
      spotsFilled: spotsFilled + 1,
      attendees: [...attendees, attendeeName],
    });
  });
}

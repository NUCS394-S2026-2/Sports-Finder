import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { initialGames } from '../data';
import type { GameDraft, PickupGame, SportName, User } from '../types';
import { db } from './firebase';

const gamesCol = collection(db, 'games');

function mapDocToGame(id: string, data: Record<string, unknown>): PickupGame {
  return {
    id,
    sport: data.sport as SportName,
    location: String(data.location ?? ''),
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    capacity: Number(data.capacity ?? 0),
    organizer: String(data.organizer ?? ''),
    note: String(data.note ?? ''),
    skillLevel: data.skillLevel as PickupGame['skillLevel'],
    ageRange: String(data.ageRange ?? ''),
    gender: data.gender as PickupGame['gender'],
    requirements: String(data.requirements ?? ''),
    players: Array.isArray(data.players) ? (data.players as PickupGame['players']) : [],
  };
}

export async function fetchGames(): Promise<PickupGame[]> {
  const q = query(gamesCol, orderBy('startTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDocToGame(d.id, d.data()));
}

export async function seedGamesIfEmpty(): Promise<void> {
  const snapshot = await getDocs(gamesCol);

  if (!snapshot.empty) {
    // Check if existing data has the correct schema (needs 'players' array field)
    const firstDoc = snapshot.docs[0].data();
    if ('players' in firstDoc) return; // Already correct schema, nothing to do

    // Old schema detected — delete all documents and re-seed
    await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, 'games', d.id))));
  }

  await Promise.all(
    initialGames.map((g) => {
      const { id, ...game } = g;
      void id;
      return addDoc(gamesCol, game);
    }),
  );
}

export function findConflict(
  draft: { sport: string; location: string; startTime: string },
  games: PickupGame[],
): PickupGame | undefined {
  return games.find(
    (g) =>
      g.sport === draft.sport &&
      g.location === draft.location &&
      Math.abs(new Date(g.startTime).getTime() - new Date(draft.startTime).getTime()) <
        30 * 60 * 1000,
  );
}

export function joinGame(gameId: string, user: User, games: PickupGame[]): PickupGame[] {
  return games.map((g) => {
    if (g.id !== gameId) return g;
    if (g.players.some((p) => p.email === user.email)) return g;
    return { ...g, players: [...g.players, user] };
  });
}

export async function createGame(
  draft: GameDraft & { organizer: string },
  games: PickupGame[],
  options?: { ignoreConflict?: boolean },
): Promise<{ conflict?: PickupGame; game?: PickupGame }> {
  const conflict = findConflict(draft, games);
  if (conflict && !options?.ignoreConflict) {
    return { conflict };
  }
  const game = await saveGame(draft);
  return { game };
}

export async function saveGame(
  draft: GameDraft & { organizer: string },
): Promise<PickupGame> {
  const newGame = {
    sport: draft.sport as SportName,
    location: draft.location,
    startTime: draft.startTime,
    endTime: draft.endTime,
    capacity: draft.capacity,
    organizer: draft.organizer,
    note: draft.note,
    skillLevel: draft.skillLevel,
    ageRange: draft.ageRange,
    gender: draft.gender,
    requirements: draft.requirements,
    players: [{ name: draft.organizer.split('@')[0], email: draft.organizer }],
  };
  const ref = await addDoc(gamesCol, newGame);
  return { id: ref.id, ...newGame };
}

export async function addPlayerToGame(gameId: string, user: User): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    players: arrayUnion(user),
  });
}

export async function removePlayerFromGame(gameId: string, user: User): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    players: arrayRemove(user),
  });
}

export function leaveGame(gameId: string, user: User, games: PickupGame[]): PickupGame[] {
  return games.map((g) => {
    if (g.id !== gameId) return g;
    return {
      ...g,
      players: g.players.filter((p) => p.email !== user.email),
    };
  });
}

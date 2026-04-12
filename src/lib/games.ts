import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore';

import { initialGames } from '../data';
import type { GameDraft, PickupGame, SportName, User } from '../types';
import { db } from './firebase';

const gamesCol = collection(db, 'games');

export async function fetchGames(): Promise<PickupGame[]> {
  const q = query(gamesCol, orderBy('startTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PickupGame, 'id'>),
  }));
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
    initialGames.map(({ id: _id, ...game }) => addDoc(gamesCol, game)),
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
      Math.abs(
        new Date(g.startTime).getTime() - new Date(draft.startTime).getTime(),
      ) <
        30 * 60 * 1000,
  );
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
    players: [
      { name: draft.organizer.split('@')[0], email: draft.organizer },
    ],
  };
  const ref = await addDoc(gamesCol, newGame);
  return { id: ref.id, ...newGame };
}

export async function addPlayerToGame(
  gameId: string,
  user: User,
): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    players: arrayUnion(user),
  });
}

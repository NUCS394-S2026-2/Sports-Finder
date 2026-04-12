import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { db } from './firebase';
import type { GameDraft, PickupGame, SportName, User } from '../types';

const gamesCollection = collection(db, 'games');

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
    players: Array.isArray(data.players)
      ? (data.players as PickupGame['players'])
      : [],
  };
}

export async function fetchGames(): Promise<PickupGame[]> {
  const snapshot = await getDocs(gamesCollection);

  return snapshot.docs
    .map((gameDoc) => mapDocToGame(gameDoc.id, gameDoc.data()))
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
}

export async function createGame(
  draft: GameDraft,
  games: PickupGame[],
): Promise<{ game?: PickupGame; conflict?: PickupGame }> {
  const conflict = games.find(
    (g) =>
      g.sport === draft.sport &&
      g.location === draft.location &&
      Math.abs(
        new Date(g.startTime).getTime() - new Date(draft.startTime).getTime(),
      ) <
        30 * 60 * 1000,
  );

  if (conflict) {
    return { conflict };
  }

  const newGameData = {
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
      {
        name: draft.organizer.split('@')[0],
        email: draft.organizer,
      },
    ],
  };

  const docRef = await addDoc(gamesCollection, newGameData);

  return {
    game: {
      id: docRef.id,
      ...newGameData,
    },
  };
}

export async function joinGame(
  gameId: string,
  user: User,
  games: PickupGame[],
): Promise<PickupGame[]> {
  const targetGame = games.find((g) => g.id === gameId);

  if (!targetGame) return games;

  if (targetGame.players.length >= targetGame.capacity) return games;

  if (targetGame.players.some((p) => p.email === user.email)) return games;

  const updatedPlayers = [...targetGame.players, user];

  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { players: updatedPlayers });

  return games.map((g) =>
    g.id === gameId ? { ...g, players: updatedPlayers } : g,
  );
}
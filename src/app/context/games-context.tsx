import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { db } from '../lib/firebase';
import { applyAutoCancellation } from '../lib/game-schedule';
import { playerHasSchedulingConflict } from '../lib/game-time';

export type GameGender = 'Co-ed' | "Men's" | "Women's";

export interface Game {
  id: string;
  sport: string;
  title: string;
  location: string;
  address?: string;
  date: string;
  time: string;
  endTime?: string;
  maxPlayers: number;
  minPlayers: number;
  currentPlayers: number;
  competitiveLevel: 'Casual' | 'Intermediate' | 'Competitive';
  gender: GameGender;
  notes?: string;
  players: string[];
  hostName: string;
  /** Set when auto-cancelled (under min players inside 30 min before start). */
  cancelled?: boolean;
}

interface GamesContextType {
  games: Game[];
  isGamesLoading: boolean;
  addGame: (game: Omit<Game, 'id' | 'currentPlayers' | 'players'>) => Promise<void>;
  /** Returns false if the game is full, the player is already in, or another joined game overlaps in time. */
  joinGame: (gameId: string, playerName: string) => Promise<boolean>;
  leaveGame: (gameId: string, playerName: string) => Promise<void>;
  cancelGame: (gameId: string) => Promise<void>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);
const gamesCollection = collection(db, 'games');

function asGame(snapshot: { id: string; data: () => Record<string, unknown> }): Game {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    sport: String(d.sport ?? ''),
    title: String(d.title ?? ''),
    location: String(d.location ?? ''),
    address: d.address ? String(d.address) : undefined,
    date: String(d.date ?? ''),
    time: String(d.time ?? ''),
    endTime: d.endTime ? String(d.endTime) : undefined,
    maxPlayers: Number(d.maxPlayers ?? 0),
    minPlayers: Number(d.minPlayers ?? 0),
    currentPlayers: Number(d.currentPlayers ?? 0),
    competitiveLevel: (d.competitiveLevel ?? 'Casual') as Game['competitiveLevel'],
    gender: (d.gender ?? 'Co-ed') as Game['gender'],
    notes: d.notes ? String(d.notes) : undefined,
    players: Array.isArray(d.players) ? d.players.map((p) => String(p)) : [],
    hostName: String(d.hostName ?? 'Host'),
    cancelled: Boolean(d.cancelled),
  };
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [isGamesLoading, setIsGamesLoading] = useState(true);

  useEffect(() => {
    const q = query(gamesCollection, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setGames(snap.docs.map((d) => asGame({ id: d.id, data: () => d.data() })));
      setIsGamesLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const updates = applyAutoCancellation(games, Date.now()).filter(
        (g, i) => !games[i]?.cancelled && g.cancelled,
      );
      if (!updates.length) return;
      const batch = writeBatch(db);
      updates.forEach((g) => {
        batch.update(doc(db, 'games', g.id), { cancelled: true });
      });
      await batch.commit();
    }, 60_000);
    return () => clearInterval(id);
  }, [games]);

  const addGame = async (gameData: Omit<Game, 'id' | 'currentPlayers' | 'players'>) => {
    const hostGames = games.filter(
      (g) => !g.cancelled && g.hostName === gameData.hostName,
    );
    const hasDuplicateStart = hostGames.some(
      (g) => g.date === gameData.date && g.time === gameData.time,
    );
    if (hasDuplicateStart) {
      throw new Error('HOST_DUPLICATE_START_TIME');
    }

    const nowMs = Date.now();
    const activeHostedCount = hostGames.filter((g) => {
      const startMs = Date.parse(`${g.date} ${g.time}`);
      return !Number.isNaN(startMs) && startMs >= nowMs;
    }).length;
    if (activeHostedCount >= 3) {
      throw new Error('HOST_ACTIVE_GAMES_LIMIT');
    }

    await addDoc(gamesCollection, {
      ...gameData,
      currentPlayers: 0,
      players: [],
      cancelled: false,
      createdAt: serverTimestamp(),
    });
  };

  const joinGame = async (gameId: string, playerName: string): Promise<boolean> => {
    const target = games.find((g) => g.id === gameId);
    if (
      !target ||
      target.cancelled ||
      target.currentPlayers >= target.maxPlayers ||
      target.players.includes(playerName) ||
      playerHasSchedulingConflict(games, playerName, target)
    ) {
      return false;
    }

    return runTransaction(db, async (transaction) => {
      const ref = doc(db, 'games', gameId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) return false;
      const target = asGame({ id: snap.id, data: () => snap.data() });
      if (
        target.cancelled ||
        target.currentPlayers >= target.maxPlayers ||
        target.players.includes(playerName)
      ) {
        return false;
      }
      transaction.update(ref, {
        currentPlayers: target.currentPlayers + 1,
        players: [...target.players, playerName],
      });
      return true;
    });
  };

  const leaveGame = async (gameId: string, playerName: string) => {
    const target = games.find((g) => g.id === gameId);
    if (!target || !target.players.includes(playerName)) return;
    await updateDoc(doc(db, 'games', gameId), {
      currentPlayers: Math.max(0, target.currentPlayers - 1),
      players: target.players.filter((p) => p !== playerName),
      updatedAt: Timestamp.now(),
    });
  };

  const cancelGame = async (gameId: string) => {
    await updateDoc(doc(db, 'games', gameId), {
      cancelled: true,
      updatedAt: Timestamp.now(),
    });
  };

  return (
    <GamesContext.Provider
      value={{ games, isGamesLoading, addGame, joinGame, leaveGame, cancelGame }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
}

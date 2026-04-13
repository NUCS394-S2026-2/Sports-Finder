import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { initialGames } from '../data';
import type { GameDraft, PickupGame, SportName, User } from '../types';
import { db, getFirebaseProjectIdForDiagnostics, isFirebaseConfigured } from './firebase';

const gamesCol = collection(db, 'games');

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Parse Firestore roster: lowercase emails, drop duplicate emails (bad legacy data). */
function playersFromRaw(raw: unknown): PickupGame['players'] {
  if (!Array.isArray(raw)) return [];
  const out: PickupGame['players'] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const email = normalizeEmail(String(o.email ?? ''));
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const nameRaw = String(o.name ?? '').trim();
    out.push({
      name: nameRaw || email.split('@')[0] || 'Player',
      email,
    });
  }
  return out;
}

function mapDocToGame(id: string, data: Record<string, unknown>): PickupGame {
  return {
    id,
    sport: data.sport as SportName,
    location: String(data.location ?? ''),
    startTime: String(data.startTime ?? ''),
    endTime: String(data.endTime ?? ''),
    capacity: Number(data.capacity ?? 0),
    organizer: normalizeEmail(String(data.organizer ?? '')),
    note: String(data.note ?? ''),
    skillLevel: data.skillLevel as PickupGame['skillLevel'],
    ageRange: String(data.ageRange ?? ''),
    gender: data.gender as PickupGame['gender'],
    requirements: String(data.requirements ?? ''),
    players: playersFromRaw(data.players),
  };
}

/** Detect Firestore auth/rules denials (code + message shape varies by SDK / bundler). */
export function isFirestorePermissionError(err: unknown): boolean {
  if (err instanceof FirebaseError && err.code === 'permission-denied') return true;
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    if (code === 'permission-denied' || code.includes('permission-denied')) return true;
  }
  const message =
    err instanceof Error
      ? err.message
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : '';
  const m = message.toLowerCase();
  return (
    m.includes('insufficient permissions') ||
    m.includes('missing or insufficient') ||
    m.includes('permission denied') ||
    /permission.denied|permission_denied|PERMISSION_DENIED/i.test(message)
  );
}

function isFirestoreNotFound(err: unknown): boolean {
  if (err instanceof FirebaseError && err.code === 'not-found') return true;
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: string }).code) === 'not-found';
  }
  return false;
}

/** Sorted bundled games when Firestore is unavailable or read-denied. */
export function getLocalGamesFallback(): PickupGame[] {
  return [...initialGames].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

/** Game id used when Firestore rejected create — exists only until you refresh. */
export function isSessionOnlyGameId(gameId: string): boolean {
  return gameId.startsWith('local-');
}

function sortGamesByStart(games: PickupGame[]): PickupGame[] {
  return [...games].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export type FetchGamesOutcome = {
  games: PickupGame[];
  source: 'firestore' | 'bundled-unconfigured' | 'bundled-permission';
};

/**
 * Loads games from Firestore. Uses a plain collection read (no orderBy) so reads are not blocked
 * by missing composite indexes. Returns metadata so the UI can explain bundled fallbacks.
 */
export async function fetchGames(): Promise<FetchGamesOutcome> {
  if (!isFirebaseConfigured()) {
    console.warn(
      'fetchGames: VITE_FIREBASE_* not set — using bundled sample games (nothing is loaded from the cloud).',
    );
    return { games: getLocalGamesFallback(), source: 'bundled-unconfigured' };
  }

  const mapDocs = (snapshot: Awaited<ReturnType<typeof getDocs>>) =>
    snapshot.docs.map((d) => mapDocToGame(d.id, d.data() as Record<string, unknown>));

  try {
    const snapshot = await getDocs(gamesCol);
    return { games: sortGamesByStart(mapDocs(snapshot)), source: 'firestore' };
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      const pid = getFirebaseProjectIdForDiagnostics();
      console.warn(
        [
          `fetchGames: Firestore returned permission-denied for project "${pid || '(unknown)'}".`,
          'Rules that allow read/write can still see this if:',
          '(1) VITE_FIREBASE_PROJECT_ID / web app config is for a different Firebase project than the one where you edited rules;',
          '(2) Firebase Console → App Check → Firestore has enforcement ON (turn it off for dev or register this web app);',
          '(3) Google Cloud Console → APIs & Services → Credentials: the browser API key is restricted in a way that blocks Firestore.',
        ].join(' '),
        err,
      );
      return { games: getLocalGamesFallback(), source: 'bundled-permission' };
    }
    throw err;
  }
}

export async function seedGamesIfEmpty(): Promise<void> {
  async function writeBundledGamesSeed(): Promise<void> {
    try {
      await Promise.all(
        initialGames.map((g) => {
          const { id, ...game } = g;
          void id;
          return addDoc(gamesCol, game);
        }),
      );
    } catch (err) {
      if (isFirestorePermissionError(err)) {
        console.warn('seedGamesIfEmpty: cannot write seed data (permission).', err);
        return;
      }
      throw err;
    }
  }

  let snapshot;
  try {
    snapshot = await getDocs(gamesCol);
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn(
        'seedGamesIfEmpty: skipped (Firestore permission denied). Fix rules in Console to enable seeding.',
        err,
      );
      return;
    }
    throw err;
  }

  if (snapshot.empty) {
    await writeBundledGamesSeed();
    return;
  }

  // Never wipe the whole collection: getDocs order is undefined. Previously we looked only at
  // docs[0]; if that doc lacked `players` we deleted *every* game and re-seeded demos only.
  const legacyDocs = snapshot.docs.filter((d) => !Array.isArray(d.data().players));
  if (legacyDocs.length > 0) {
    console.warn(
      `seedGamesIfEmpty: removing ${legacyDocs.length} legacy game document(s) missing a players array.`,
    );
    try {
      await Promise.all(legacyDocs.map((d) => deleteDoc(doc(db, 'games', d.id))));
    } catch (err) {
      if (isFirestorePermissionError(err)) {
        console.warn('seedGamesIfEmpty: cannot remove legacy documents (permission).', err);
        return;
      }
      throw err;
    }
  }

  let after;
  try {
    after = await getDocs(gamesCol);
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn('seedGamesIfEmpty: skipped post-cleanup read (permission).', err);
      return;
    }
    throw err;
  }

  if (after.empty) {
    await writeBundledGamesSeed();
  }
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
  const me = { name: user.name.trim(), email: normalizeEmail(user.email) };
  return games.map((g) => {
    if (g.id !== gameId) return g;
    if (g.players.some((p) => p.email === me.email)) return g;
    return { ...g, players: [...g.players, me] };
  });
}

export async function createGame(
  draft: GameDraft & { organizer: string },
  games: PickupGame[],
): Promise<{ conflict?: PickupGame; game?: PickupGame }> {
  const conflict = findConflict(draft, games);
  if (conflict) {
    return { conflict };
  }
  const game = await saveGame(draft);
  return { game };
}

function newLocalGameId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `local-${c.randomUUID()}`;
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function saveGame(
  draft: GameDraft & { organizer: string },
): Promise<PickupGame> {
  const organizer = normalizeEmail(draft.organizer);
  const hostLocalPart = organizer.split('@')[0] || 'Host';
  const newGame = {
    sport: draft.sport as SportName,
    location: draft.location,
    startTime: draft.startTime,
    endTime: draft.endTime,
    capacity: draft.capacity,
    organizer,
    note: draft.note,
    skillLevel: draft.skillLevel,
    ageRange: draft.ageRange,
    gender: draft.gender,
    requirements: draft.requirements,
    players: [{ name: hostLocalPart, email: organizer }],
  };
  try {
    const ref = await addDoc(gamesCol, newGame);
    return { id: ref.id, ...newGame };
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn(
        'saveGame: Firestore write denied — game added for this session only until rules allow writes.',
        err,
      );
      return { id: newLocalGameId(), ...newGame };
    }
    throw err;
  }
}

export async function addPlayerToGame(gameId: string, user: User): Promise<void> {
  if (gameId.startsWith('local-')) {
    console.warn(
      'addPlayerToGame: session-only id — no Firestore document to update (roster is local only).',
    );
    return;
  }
  const me = { name: user.name.trim(), email: normalizeEmail(user.email) };
  if (!me.email) {
    console.warn('addPlayerToGame: missing email; cannot persist roster change.');
    return;
  }
  const gameRef = doc(db, 'games', gameId);
  try {
    const snap = await getDoc(gameRef);
    if (!snap.exists()) {
      console.warn(
        'addPlayerToGame: game document not found; roster updated locally only.',
      );
      return;
    }
    const data = snap.data() as Record<string, unknown>;
    const players = playersFromRaw(data.players);
    if (players.some((p) => p.email === me.email)) return;
    await updateDoc(gameRef, { players: [...players, me] });
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn(
        'addPlayerToGame: Firestore write denied — roster updated in the UI only until rules allow updates.',
        err,
      );
      return;
    }
    if (isFirestoreNotFound(err)) {
      console.warn(
        'addPlayerToGame: no cloud document for this game; roster updated locally only.',
        err,
      );
      return;
    }
    throw err;
  }
}

export async function removePlayerFromGame(gameId: string, user: User): Promise<void> {
  if (gameId.startsWith('local-')) {
    console.warn(
      'removePlayerFromGame: session-only id — no Firestore document to update (roster is local only).',
    );
    return;
  }
  const targetEmail = normalizeEmail(user.email);
  const gameRef = doc(db, 'games', gameId);
  try {
    const snap = await getDoc(gameRef);
    if (!snap.exists()) {
      console.warn(
        'removePlayerFromGame: game document not found; roster updated locally only.',
      );
      return;
    }
    const data = snap.data() as Record<string, unknown>;
    const players = playersFromRaw(data.players);
    const next = players.filter((p) => p.email !== targetEmail);
    if (next.length === players.length) return;
    await updateDoc(gameRef, { players: next });
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn(
        'removePlayerFromGame: Firestore write denied — roster updated in the UI only until rules allow updates.',
        err,
      );
      return;
    }
    if (isFirestoreNotFound(err)) {
      console.warn(
        'removePlayerFromGame: no cloud document for this game; roster updated locally only.',
        err,
      );
      return;
    }
    throw err;
  }
}

/** Deletes the game document. Session-only ids (`local-…`) skip Firestore. */
export async function deleteGameFromFirestore(gameId: string): Promise<void> {
  if (gameId.startsWith('local-')) return;
  try {
    await deleteDoc(doc(db, 'games', gameId));
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn(
        'deleteGameFromFirestore: Firestore denied — listing removed in the UI only until rules allow deletes.',
        err,
      );
      return;
    }
    if (isFirestoreNotFound(err)) return;
    throw err;
  }
}

export function leaveGame(gameId: string, user: User, games: PickupGame[]): PickupGame[] {
  const target = normalizeEmail(user.email);
  return games.map((g) => {
    if (g.id !== gameId) return g;
    return {
      ...g,
      players: g.players.filter((p) => p.email !== target),
    };
  });
}

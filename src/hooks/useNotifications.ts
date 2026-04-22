import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import type { AppNotification } from '../components/NotificationList';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { isSessionOnlyGameId } from '../lib/games';
import type { PickupGame, User } from '../types';

// ── localStorage key helpers ────────────────────────────────────────────────
const storageKey = (email: string) => `psf_notif_${email}`;
const seenKey = (email: string, gameId: string) => `psf_seen_${email}_${gameId}`;
const firedKey = (email: string) => `psf_evtfired_${email}`;

function loadNotifications(email: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifications(email: string, items: AppNotification[]) {
  localStorage.setItem(storageKey(email), JSON.stringify(items.slice(0, 50)));
}

function loadSeenTime(email: string, gameId: string): number {
  const raw = localStorage.getItem(seenKey(email, gameId));
  return raw ? parseInt(raw, 10) : 0;
}

function saveSeenTime(email: string, gameId: string, ts: number) {
  localStorage.setItem(seenKey(email, gameId), String(ts));
}

function loadFiredSet(email: string): Set<string> {
  try {
    const raw = localStorage.getItem(firedKey(email));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveFiredSet(email: string, fired: Set<string>) {
  localStorage.setItem(firedKey(email), JSON.stringify([...fired]));
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(
  user: User | null,
  signedUpGames: PickupGame[],
  detailGameId: string | null,
) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    user ? loadNotifications(user.email) : [],
  );

  // Always-fresh ref so Firestore callbacks never see a stale detailGameId
  const detailGameIdRef = useRef(detailGameId);
  // Active Firestore unsubscribers keyed by game ID
  const listenersRef = useRef<Map<string, () => void>>(new Map());

  // Keep ref current on every render (cheap — no localStorage I/O)
  useEffect(() => {
    detailGameIdRef.current = detailGameId;
  });

  // Reload notifications from localStorage when user signs in/out
  useEffect(() => {
    if (!user) {
      setNotifications([]);
    } else {
      setNotifications(loadNotifications(user.email));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // When user navigates to a game detail page: mark its messages as seen
  // and auto-read any pending notifications for that game.
  useEffect(() => {
    if (!user || !detailGameId) return;
    const email = user.email;
    saveSeenTime(email, detailGameId, Date.now());
    setNotifications((prev) => {
      const hasUnread = prev.some((n) => n.gameId === detailGameId && n.unread);
      if (!hasUnread) return prev;
      const updated = prev.map((n) =>
        n.gameId === detailGameId ? { ...n, unread: false } : n,
      );
      saveNotifications(email, updated);
      return updated;
    });
  }, [user, detailGameId]);

  // Stable string that only changes when the *set of joined game IDs* changes,
  // not every time a player count or other field changes. This prevents
  // unnecessary listener teardown/recreation on every Firestore update.
  const gameIdsKey = signedUpGames.map((g) => g.id).join(',');

  // ── Message listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      listenersRef.current.forEach((unsub) => unsub());
      listenersRef.current.clear();
      return;
    }

    const email = user.email;
    const activeIds = new Set(signedUpGames.map((g) => g.id));

    // Remove listeners for games the user is no longer joined to
    for (const [gameId, unsub] of listenersRef.current) {
      if (!activeIds.has(gameId)) {
        unsub();
        listenersRef.current.delete(gameId);
      }
    }

    // Add listeners for newly joined games
    for (const game of signedUpGames) {
      if (listenersRef.current.has(game.id)) continue;
      if (isSessionOnlyGameId(game.id)) continue;

      // First visit: initialize seen-time to now so old messages don't notify
      if (!localStorage.getItem(seenKey(email, game.id))) {
        saveSeenTime(email, game.id, Date.now());
      }

      const gameId = game.id;
      const gameSport = game.sport;
      const gameLocation = game.location;

      // Only fetch the single latest message — minimizes Firestore reads
      const q = query(
        collection(db, 'games', gameId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(1),
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) return;
          const msgDoc = snapshot.docs[0];
          const data = msgDoc.data();
          const msgTs: number = data.timestamp?.toMillis?.() ?? 0;
          const senderId = String(data.senderId ?? '').toLowerCase();

          // Ignore own messages
          if (senderId === email.toLowerCase()) return;

          // Ignore if already processed
          if (msgTs <= loadSeenTime(email, gameId)) return;

          // Update seen time regardless so we don't re-trigger
          saveSeenTime(email, gameId, msgTs);

          // If user is actively viewing this game, just update seen — no popup
          if (detailGameIdRef.current === gameId) return;

          const notifId = `msg_${gameId}_${msgDoc.id}`;
          const rawText = String(data.text ?? '');
          const preview = rawText.length > 80 ? rawText.slice(0, 80) + '…' : rawText;
          const senderName = String(data.senderName ?? 'Someone');

          setNotifications((prev) => {
            if (prev.some((n) => n.id === notifId)) return prev;
            const notif: AppNotification = {
              id: notifId,
              kind: 'message',
              title: `${gameSport} · ${gameLocation}`,
              body: `${senderName}: ${preview}`,
              time: relativeTime(Date.now()),
              createdAt: Date.now(),
              unread: true,
              gameId,
            };
            const next = [notif, ...prev].slice(0, 50);
            saveNotifications(email, next);
            return next;
          });
        },
        (err) => {
          // Best-effort — silently ignore permission/network errors
          console.warn(`useNotifications: snapshot error for game ${gameId}`, err);
        },
      );

      listenersRef.current.set(gameId, unsub);
    }

    return () => {
      listenersRef.current.forEach((unsub) => unsub());
      listenersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, gameIdsKey]);

  // ── Event-soon notifications (≤15 min) ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const email = user.email;

    function checkUpcoming() {
      const fired = loadFiredSet(email);
      const now = Date.now();
      const window15 = 15 * 60 * 1000;

      for (const game of signedUpGames) {
        if (fired.has(game.id)) continue;
        const start = new Date(game.startTime).getTime();
        if (start > now && start - now <= window15) {
          fired.add(game.id);
          saveFiredSet(email, fired);

          const timeStr = new Date(game.startTime).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          });

          const notif: AppNotification = {
            id: `soon_${game.id}`,
            kind: 'event-soon',
            title: `${game.sport} starts in ~15 min`,
            body: `${game.location} · ${timeStr}`,
            time: 'Now',
            createdAt: Date.now(),
            unread: true,
            gameId: game.id,
          };

          setNotifications((prev) => {
            if (prev.some((n) => n.id === notif.id)) return prev;
            const next = [notif, ...prev].slice(0, 50);
            saveNotifications(email, next);
            return next;
          });
        }
      }
    }

    checkUpcoming();
    const intervalId = setInterval(checkUpcoming, 60_000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, gameIdsKey]);

  // ── Public API ───────────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, unread: false } : n));
        if (user) saveNotifications(user.email, next);
        return next;
      });
    },
    [user],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, unread: false }));
      if (user) saveNotifications(user.email, next);
      return next;
    });
  }, [user]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (user) saveNotifications(user.email, []);
  }, [user]);

  return { notifications, unreadCount, markRead, markAllRead, clearAll };
}

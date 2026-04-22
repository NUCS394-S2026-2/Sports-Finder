import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { isSessionOnlyGameId } from '../lib/games';

function toInitials(nameOrEmail) {
  const value = String(nameOrEmail ?? '').trim();
  if (!value) return '?';
  const base = value.includes('@') ? value.split('@')[0] : value;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return 'Sending...';
  return timestamp.toDate().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function GameChat({ gameId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomAnchorRef = useRef(null);

  const senderId = useMemo(
    () =>
      String(currentUser?.email ?? '')
        .trim()
        .toLowerCase(),
    [currentUser],
  );
  const senderName = useMemo(
    () => String(currentUser?.name ?? '').trim() || 'Player',
    [currentUser],
  );
  const senderInitials = useMemo(
    () => toInitials(currentUser?.name || currentUser?.email || ''),
    [currentUser],
  );

  async function ensureJoinedMembership() {
    if (!gameId || !senderId || isSessionOnlyGameId(gameId)) return;
    try {
      await updateDoc(doc(db, 'games', gameId), {
        playerEmails: arrayUnion(senderId),
      });
    } catch (err) {
      // If this fails, message write may still succeed when rules are already satisfied.
      console.warn('GameChat: failed to repair playerEmails membership.', err);
    }
  }

  useEffect(() => {
    if (!gameId || !senderId) {
      setMessages([]);
      return () => {};
    }

    if (isSessionOnlyGameId(gameId)) {
      setMessages([]);
      setError('Chat is unavailable for session-only games.');
      return () => {};
    }

    setError(null);
    let unsubscribe = () => {};
    let cancelled = false;

    void (async () => {
      await ensureJoinedMembership();
      if (cancelled) return;

      const messagesRef = collection(db, 'games', gameId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          setMessages(
            snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                senderId: String(data.senderId ?? ''),
                senderName: String(data.senderName ?? 'Player'),
                senderInitials: String(data.senderInitials ?? '?'),
                text: String(data.text ?? ''),
                timestamp: data.timestamp ?? null,
              };
            }),
          );
        },
        (err) => {
          console.error('GameChat: onSnapshot failed.', err);
          setError('Could not load chat right now.');
        },
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [gameId, senderId]);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !senderId || !gameId || sending) return;

    if (isSessionOnlyGameId(gameId)) {
      setError('Chat is unavailable for session-only games.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await ensureJoinedMembership();
      await addDoc(collection(db, 'games', gameId, 'messages'), {
        senderId,
        senderName,
        senderInitials,
        text,
        timestamp: serverTimestamp(),
      });
      setDraft('');
    } catch (err) {
      console.error('GameChat: failed to send message.', err);
      setError('Message failed to send.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-white/12 bg-[rgba(7,13,21,0.76)] shadow-[0_14px_36px_rgba(2,8,18,0.35)]"
      aria-label="Game chat"
    >
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-cream-muted">
          Game chat
        </h3>
        <p className="mt-1 text-xs text-cream-muted">
          Only joined players can see and send messages.
        </p>
      </div>

      <div className="flex h-[25rem] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-4 text-center text-sm text-cream-muted">
              No messages yet. Say hi to the squad.
            </p>
          ) : (
            messages.map((message) => {
              const isMine = message.senderId.toLowerCase() === senderId;
              return (
                <article
                  key={message.id}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold ${
                        isMine
                          ? 'border-brand-300/40 bg-brand-400/20 text-brand-300'
                          : 'border-white/15 bg-white/10 text-cream'
                      }`}
                      aria-hidden
                    >
                      {message.senderInitials || '?'}
                    </span>
                    <div
                      className={`max-w-[16rem] rounded-2xl px-3 py-2 ${
                        isMine
                          ? 'rounded-br-md bg-brand-500/25 text-cream ring-1 ring-brand-400/40'
                          : 'rounded-bl-md bg-white/10 text-cream ring-1 ring-white/10'
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-cream-muted">
                        {message.senderName} · {formatTime(message.timestamp)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-cream">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
          <div ref={bottomAnchorRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
          <div className="flex items-end gap-2">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={800}
              placeholder="Message players..."
              className="h-11 flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-sm text-cream placeholder:text-cream-muted focus:border-brand-400/60 focus:outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || draft.trim().length === 0}
              className="h-11 rounded-xl bg-brand-500 px-4 text-sm font-bold text-ink transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Send
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-200">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}

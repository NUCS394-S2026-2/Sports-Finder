import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { isFirebaseConfigured } from '../lib/firebase';
import { sendMessage, subscribeToMessages, type ChatMessage } from '../lib/chat';

type ChatUser = {
  uid: string;
  name: string;
  email: string;
};

type GameChatProps = {
  gameId: string;
  currentUser: ChatUser | null;
};

function formatTime(timestamp: ChatMessage['createdAt']): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function GameChat({ gameId, currentUser }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Session-only (local-) games have no Firestore document to chat in.
  const isLocalGame = gameId.startsWith('local-');

  useEffect(() => {
    if (isLocalGame || !isFirebaseConfigured()) return;
    const unsub = subscribeToMessages(
      gameId,
      (msgs) => setMessages(msgs),
      () => setError('Could not load messages. Check your connection.'),
    );
    return unsub;
  }, [gameId, isLocalGame]);

  // Auto-scroll to the latest message whenever messages update.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!currentUser || !inputText.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(gameId, inputText, currentUser);
      setInputText('');
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  if (isLocalGame) {
    return (
      <section
        className="rounded-2xl border border-white/10 bg-white/5 p-5"
        aria-label="Game chat"
      >
        <h2 className="text-lg font-bold tracking-tight text-cream">Game Chat</h2>
        <p className="mt-3 text-sm text-cream-muted">
          Chat is not available for this game because it was not saved to Firestore.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-white/10 bg-white/5 p-5"
      aria-label="Game chat"
    >
      <h2 className="text-lg font-bold tracking-tight text-cream">Game Chat</h2>

      {/* Message list */}
      <div
        className="mt-4 h-72 overflow-y-auto space-y-3 pr-1"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-cream-muted">
            No messages yet. Say something!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = currentUser?.uid === msg.senderId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                    isOwn
                      ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-ink'
                      : 'border border-white/15 bg-white/10 text-cream'
                  }`}
                  aria-hidden
                >
                  {initials(msg.senderName)}
                </span>

                {/* Bubble */}
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div className="flex items-baseline gap-2">
                    {!isOwn && (
                      <span className="text-xs font-semibold text-cream">
                        {msg.senderName}
                      </span>
                    )}
                    <span className="text-[10px] text-cream-muted">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isOwn
                        ? 'rounded-tr-sm bg-gradient-to-br from-brand-500/30 to-brand-400/25 text-cream ring-1 ring-brand-400/30'
                        : 'rounded-tl-sm border border-white/10 bg-white/[0.06] text-cream'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} aria-hidden />
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}

      {/* Input row */}
      {currentUser ? (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            maxLength={1000}
            disabled={sending}
            className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-cream placeholder:text-cream/40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-400 disabled:opacity-50"
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !inputText.trim()}
            className="min-h-[44px] rounded-xl border border-brand-400/40 bg-brand-500/20 px-4 text-sm font-bold text-brand-300 transition hover:border-brand-400/60 hover:bg-brand-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-cream-muted">
          Sign in to participate in the chat.
        </p>
      )}
    </section>
  );
}

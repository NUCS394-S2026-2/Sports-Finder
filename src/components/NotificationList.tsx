import type { ReactNode } from 'react';

export type AppNotification = {
  id: string;
  kind: 'info' | 'cancel' | 'message' | 'event-soon';
  title: string;
  body?: string;
  time: string;
  createdAt?: number;
  unread?: boolean;
  /** When present the whole row is clickable and navigates to this game. */
  gameId?: string;
};

type NotificationListProps = {
  items: AppNotification[];
  onBrowseGames?: () => void;
  onNotificationClick?: (notif: AppNotification) => void;
  onMarkAllRead?: () => void;
  className?: string;
};

export function NotificationList({
  items,
  onBrowseGames,
  onNotificationClick,
  onMarkAllRead,
  className = '',
}: NotificationListProps) {
  const unreadCount = items.filter((n) => n.unread).length;

  if (items.length === 0) {
    return (
      <p className={`px-4 py-8 text-center text-sm text-cream-muted ${className}`.trim()}>
        You&apos;re all caught up.
      </p>
    );
  }

  return (
    <div className={className}>
      {onMarkAllRead && unreadCount > 0 && (
        <div className="flex justify-end border-b border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-brand-400 hover:underline"
          >
            Mark all read
          </button>
        </div>
      )}
      <ul className="divide-y divide-white/8">
        {items.map((n) => {
          const clickable = !!n.gameId && !!onNotificationClick;
          const rowContent =
            n.kind === 'cancel' ? (
              <CancelRow
                title={n.title}
                body={n.body}
                time={n.time}
                onBrowseGames={onBrowseGames}
              />
            ) : (
              <DefaultRow
                kind={n.kind}
                title={n.title}
                body={n.body}
                time={n.time}
                unread={n.unread}
              />
            );

          return (
            <li key={n.id} className="relative">
              {clickable ? (
                <button
                  type="button"
                  className="w-full text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400/50"
                  onClick={() => onNotificationClick(n)}
                >
                  {rowContent}
                </button>
              ) : (
                rowContent
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const kindIcon: Record<AppNotification['kind'], string> = {
  info: '◉',
  message: '💬',
  'event-soon': '⏰',
  cancel: '⚠️', // unused here (cancel uses its own row component)
};

function DefaultRow({
  kind,
  title,
  body,
  time,
  unread,
}: {
  kind: AppNotification['kind'];
  title: string;
  body?: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm text-brand-400"
        aria-hidden
      >
        {kindIcon[kind] ?? '◉'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug text-cream">{title}</p>
          <time className="shrink-0 text-xs text-cream-muted">{time}</time>
        </div>
        {body && <p className="mt-1 text-sm text-cream-muted">{body}</p>}
        {unread && (
          <span
            className="mt-2 inline-flex h-2 w-2 rounded-full bg-brand-500"
            aria-label="Unread"
          />
        )}
      </div>
    </div>
  );
}

function CancelRow({
  title,
  body,
  time,
  onBrowseGames,
}: {
  title: string;
  body?: string;
  time: string;
  onBrowseGames?: () => void;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        <span className="mt-0.5 text-lg" aria-hidden>
          ⚠️
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream">{title}</p>
          {body && <p className="mt-1 text-sm text-cream-muted">{body}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {onBrowseGames && (
              <button
                type="button"
                onClick={onBrowseGames}
                className="text-sm font-semibold text-brand-400 hover:underline"
              >
                Browse other open games →
              </button>
            )}
            <time className="text-xs text-cream-muted">{time}</time>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationShell({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden">{children}</div>;
}

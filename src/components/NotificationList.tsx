import type { ReactNode } from 'react';

export type AppNotification = {
  id: string;
  kind: 'info' | 'cancel';
  title: string;
  body?: string;
  time: string;
  unread?: boolean;
  gameID?: string; // for chat notifications, to link to the game
};

type NotificationListProps = {
  items: AppNotification[];
  onBrowseGames?: () => void;
  className?: string;
};

export function NotificationList({
  items,
  onBrowseGames,
  className = '',
}: NotificationListProps) {
  if (items.length === 0) {
    return (
      <p className={`px-4 py-6 text-center text-sm text-gray-500 ${className}`.trim()}>
        You&apos;re all caught up.
      </p>
    );
  }

  return (
    <ul className={`divide-y divide-gray-100 ${className}`.trim()}>
      {items.map((n) => (
        <li key={n.id} className="relative">
          {n.kind === 'cancel' ? (
            <CancelRow
              body={n.body}
              onBrowseGames={onBrowseGames}
              time={n.time}
              title={n.title}
            />
          ) : (
            <DefaultRow time={n.time} title={n.title} unread={n.unread} />
          )}
        </li>
      ))}
    </ul>
  );
}

function DefaultRow({
  title,
  time,
  unread,
}: {
  title: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm text-brand-500"
        aria-hidden
      >
        ◉
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-ink">{title}</p>
          <time className="shrink-0 text-xs text-gray-500">{time}</time>
        </div>
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
          <p className="text-sm font-bold text-ink">{title}</p>
          {body && <p className="mt-1 text-sm text-gray-600">{body}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {onBrowseGames && (
              <button
                type="button"
                onClick={onBrowseGames}
                className="text-sm font-semibold text-brand-500 hover:underline"
              >
                Browse other open games →
              </button>
            )}
            <time className="text-xs text-gray-500">{time}</time>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
      {children}
    </div>
  );
}

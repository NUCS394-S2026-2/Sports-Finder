import { AlertTriangle, Bell } from 'lucide-react';
import { Link } from 'react-router';

import { cn } from './ui/utils';

const items = [
  {
    id: '1',
    title: 'Jordan Lee joined your Lakeside pickup',
    time: '2m ago',
    unread: true,
    variant: 'default' as const,
  },
  {
    id: '2',
    title: 'Reminder: Combe doubles ladder starts at 4:00 PM',
    time: '1h ago',
    unread: true,
    variant: 'default' as const,
  },
  {
    id: '3',
    title: 'Your game has been cancelled',
    time: 'Yesterday',
    unread: false,
    variant: 'cancel' as const,
    sub: 'Evening small-sided at Lakeside Field — minimum players not met.',
  },
];

export function NotificationsContent({ className }: { className?: string }) {
  return (
    <div className={cn('py-2', className)}>
      {items.map((n) =>
        n.variant === 'cancel' ? (
          <div key={n.id} className="border-b border-gray-100 px-4 py-4 last:border-0">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text-primary">{n.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{n.sub}</p>
                <Link
                  to="/games"
                  className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Browse other open games →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            key={n.id}
            className="flex gap-3 border-b border-gray-100 px-4 py-3 last:border-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light">
              <Bell className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">{n.title}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-text-muted">{n.time}</span>
                {n.unread ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-brand"
                    aria-label="Unread"
                  />
                ) : null}
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

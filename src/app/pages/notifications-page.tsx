import { NotificationsContent } from '../components/notifications-content';
import { AppCard } from '../components/ui/app-card';

export function NotificationsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 md:px-0">
      <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
      <AppCard className="mt-6 overflow-hidden p-0">
        <NotificationsContent />
      </AppCard>
    </div>
  );
}

import type { ViewName } from './viewNames';

type BottomTabBarProps = {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
};

const mainTabs: Array<{ view: ViewName; label: string }> = [
  { view: 'home', label: 'Home' },
  { view: 'find', label: 'Games' },
  { view: 'notifications', label: 'Alerts' },
  { view: 'profile', label: 'My Games' },
  { view: 'create', label: 'Host' },
];
export function BottomTabBar({ activeView, onNavigate }: BottomTabBarProps) {
  function isActive(view: ViewName): boolean {
    if (view === 'find') return activeView === 'find' || activeView === 'game-detail';
    return activeView === view;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[rgba(9,15,24,0.92)] px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(2,8,18,0.45)] backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-end justify-between gap-1">
        {mainTabs.map((tab) => {
          if (tab.view === 'create') {
            const active = isActive('create');
            return (
              <div key={tab.view} className="flex flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate('create')}
                  className="-mt-6 flex h-14 min-w-[3.5rem] items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-400 px-5 text-sm font-extrabold text-ink shadow-lg ring-4 ring-ink transition hover:-translate-y-0.5 active:translate-y-0"
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    ＋
                  </span>
                  <span className="sr-only">Host</span>
                  <span className="ml-1">Host</span>
                </button>
              </div>
            );
          }

          const active = isActive(tab.view);
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => onNavigate(tab.view)}
              className={`flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center rounded-xl px-2 py-1 text-xs font-semibold transition ${
                active ? 'text-brand-400' : 'text-cream-muted hover:text-cream'
              }`}
              aria-current={active ? 'page' : undefined}
            >
             <span aria-hidden className="text-base">
              {tab.view === 'home' && '⌂'}
              {tab.view === 'find' && '◎'}
              {tab.view === 'notifications' && '🔔'}
              {tab.view === 'profile' && '★'}
            </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

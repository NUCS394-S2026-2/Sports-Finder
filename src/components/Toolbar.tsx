import type { User } from '../types';

export type ViewName = 'home' | 'find' | 'create' | 'about';

type ToolbarProps = {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  user: User | null;
  onSignIn: () => void;
  onLogout: () => void;
};

const items: Array<{ view: ViewName; label: string }> = [
  { view: 'home', label: 'Home' },
  { view: 'find', label: 'Find Games' },
  { view: 'create', label: 'Create a Game' },
  { view: 'about', label: 'About' },
];

export function Toolbar({ activeView, onNavigate, user, onSignIn, onLogout }: ToolbarProps) {
  return (
    <header className="toolbar" aria-label="Primary navigation">
      <div className="toolbar-brand">
        <span className="toolbar-mark">Play Local</span>
        <p>Recreational sports for adults who want a faster way to connect.</p>
      </div>

      <nav className="toolbar-nav">
        {items.map((item) => (
          <button
            key={item.view}
            type="button"
            className={item.view === activeView ? 'toolbar-link toolbar-link-active' : 'toolbar-link'}
            onClick={() => onNavigate(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="toolbar-auth">
        {user ? (
          <>
            <span className="toolbar-user-name">Hi, {user.name}</span>
            <button type="button" className="ghost-button" onClick={onLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <button type="button" className="sign-in-button" onClick={onSignIn}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

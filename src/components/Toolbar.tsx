import { useState } from 'react';

import type { UserProfile } from '../types';

export type ViewName = 'home' | 'find' | 'create' | 'about';

type ToolbarProps = {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  profile: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
};

const items: Array<{ view: ViewName; label: string }> = [
  { view: 'home', label: 'Homepage' },
  { view: 'find', label: 'Find Local Games' },
  { view: 'create', label: 'Create a Game' },
  { view: 'about', label: 'About' },
];

export function Toolbar({
  activeView,
  onNavigate,
  profile,
  onOpenAuth,
  onLogout,
}: ToolbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
            className={
              item.view === activeView
                ? 'toolbar-link toolbar-link-active'
                : 'toolbar-link'
            }
            onClick={() => onNavigate(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="toolbar-auth">
        {profile ? (
          <div className="profile-menu-wrap">
            <button
              type="button"
              className="profile-avatar"
              onClick={() => setShowProfileMenu((current) => !current)}
              aria-label="Open profile menu"
            >
              {profile.name.charAt(0).toUpperCase()}
            </button>

            {showProfileMenu ? (
              <div className="profile-menu" role="menu">
                <p>{profile.name}</p>
                <p>{profile.email}</p>
                <p>Age: {profile.age}</p>
                <p>Gender: {profile.gender}</p>
                <button type="button" className="secondary-button" onClick={onLogout}>
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button type="button" className="secondary-button" onClick={onOpenAuth}>
            Log in
          </button>
        )}
      </div>
    </header>
  );
}

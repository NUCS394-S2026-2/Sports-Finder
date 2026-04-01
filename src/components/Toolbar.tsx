export type ViewName = 'home' | 'find' | 'create' | 'about';

type ToolbarProps = {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
};

const items: Array<{ view: ViewName; label: string }> = [
  { view: 'home', label: 'Homepage' },
  { view: 'find', label: 'Find Local Games' },
  { view: 'create', label: 'Create a Game' },
  { view: 'about', label: 'About' },
];

export function Toolbar({ activeView, onNavigate }: ToolbarProps) {
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
    </header>
  );
}

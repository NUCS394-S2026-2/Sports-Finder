import { Bell, Home, Map, PlusCircle, Settings, User, Users } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Map, label: 'Map', path: '/map' },
    { icon: PlusCircle, label: 'Add Game', path: '/add-game', isLarge: true },
    { icon: Users, label: 'Squad', path: '/squad' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0e0e0e] border-r border-[#262626]/50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#262626]/50">
          <div className="w-10 h-10 rounded-full bg-[#262626] overflow-hidden border-2 border-primary flex items-center justify-center">
            <span className="text-primary font-extrabold text-xl font-['Epilogue']">
              P
            </span>
          </div>
          <span className="font-['Epilogue'] font-extrabold tracking-tighter uppercase text-2xl text-primary">
            PickUp
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-[#262626]/50 hover:text-foreground'
                }`}
              >
                <Icon className={item.isLarge ? 'w-6 h-6' : 'w-5 h-5'} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-[#262626]/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#262626]/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">MT</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                Marcus Thorne
              </p>
              <p className="text-xs text-muted-foreground truncate">@marcus_athletic</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile/Desktop Header */}
      <div className="flex-1 lg:ml-64">
        <header className="fixed top-0 right-0 left-0 lg:left-64 w-auto z-50 bg-[#0e0e0e]/70 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-[#262626]/30">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-full bg-[#262626] overflow-hidden border-2 border-primary flex items-center justify-center">
              <span className="text-primary font-extrabold text-xl font-['Epilogue']">
                P
              </span>
            </div>
            <span className="font-['Epilogue'] font-extrabold tracking-tighter uppercase text-2xl text-primary">
              PickUp
            </span>
          </div>

          {/* Page Title for Desktop */}
          <div className="hidden lg:block">
            <h2 className="font-['Epilogue'] text-xl font-bold tracking-tight text-foreground">
              {location.pathname === '/'
                ? 'Available Games'
                : location.pathname === '/add-game'
                  ? 'Host a Game'
                  : 'PickUp'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-[#262626]/50 rounded-lg">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-[#262626]/50 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-24 pb-32 lg:pb-12 px-6 lg:px-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-[#0e0e0e]/70 backdrop-blur-xl rounded-t-[24px] shadow-[0_-12px_24px_rgba(217,109,77,0.08)] border-t border-[#262626]/30">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'text-primary drop-shadow-[0_0_10px_rgba(255,143,111,0.4)] scale-110'
                    : 'text-gray-500 hover:text-primary scale-100'
                } active:scale-95`}
              >
                <Icon className={item.isLarge ? 'w-8 h-8' : 'w-6 h-6'} />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

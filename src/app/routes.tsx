import { createBrowserRouter } from 'react-router';

import { Layout } from './components/layout';
import { AddGamePage } from './pages/add-game-page';
import { GamesPage } from './pages/games-page';

// Placeholder components for other routes
function MapPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-6xl">🗺️</div>
      <h2 className="font-['Epilogue'] text-3xl font-bold text-foreground">Map View</h2>
      <p className="text-muted-foreground">
        Coming soon - Find games near you on the map
      </p>
    </div>
  );
}

function SquadPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-6xl">👥</div>
      <h2 className="font-['Epilogue'] text-3xl font-bold text-foreground">Your Squad</h2>
      <p className="text-muted-foreground">Coming soon - Connect with your teammates</p>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-6xl">👤</div>
      <h2 className="font-['Epilogue'] text-3xl font-bold text-foreground">Profile</h2>
      <p className="text-muted-foreground">Coming soon - View and edit your profile</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: GamesPage },
      { path: 'add-game', Component: AddGamePage },
      { path: 'map', Component: MapPage },
      { path: 'squad', Component: SquadPage },
      { path: 'profile', Component: ProfilePage },
    ],
  },
]);

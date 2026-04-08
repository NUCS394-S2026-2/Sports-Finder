import { useEffect } from 'react';
import { RouterProvider } from 'react-router';

import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/auth-context';
import { GamesProvider } from './context/games-context';
import { router } from './routes';

function App() {
  useEffect(() => {
    document.title = 'Pickup Sports Finder · Northwestern';
  }, []);

  return (
    <AuthProvider>
      <GamesProvider>
        <RouterProvider router={router} />
        <Toaster />
      </GamesProvider>
    </AuthProvider>
  );
}

export default App;

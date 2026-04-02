import { useEffect } from 'react';
import { RouterProvider } from 'react-router';

import { Toaster } from './components/ui/sonner';
import { GamesProvider } from './context/games-context';
import { router } from './routes';

function App() {
  useEffect(() => {
    document.title = 'PickUp - Find Pickup Sports Games Near You';
  }, []);

  return (
    <div className="dark">
      <GamesProvider>
        <RouterProvider router={router} />
        <Toaster />
      </GamesProvider>
    </div>
  );
}

export default App;

import './App.css';

import { useEffect, useState } from 'react';

import { MainScreen } from './components/MainScreen';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { createOrUpdateUser } from './services/userService';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (currentUser) {
        try {
          await createOrUpdateUser(currentUser.id, {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
          });
        } catch (error) {
          console.error('Failed to initialize user:', error);
        }
      }
      setIsReady(true);
    };

    initializeUser();
  }, [currentUser]);

  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return <MainScreen userId={currentUser!.id} userName={currentUser!.name || 'User'} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

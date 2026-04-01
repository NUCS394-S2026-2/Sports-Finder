import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Game } from '../types';

export const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const fetchGames = async () => {
      const gamesCollection = collection(db, 'games');
      const gamesSnapshot = await getDocs(gamesCollection);
      const gamesList = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Game[];
      setGames(gamesList);
    };

    fetchGames();
  }, []);

  return { games };
};
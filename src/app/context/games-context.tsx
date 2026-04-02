import { createContext, ReactNode, useContext, useState } from 'react';

export interface Game {
  id: string;
  sport: string;
  title: string;
  location: string;
  date: string;
  time: string;
  maxPlayers: number;
  currentPlayers: number;
  competitiveLevel: 'Casual' | 'Intermediate' | 'Pro';
  notes?: string;
  players: string[];
}

interface GamesContextType {
  games: Game[];
  addGame: (game: Omit<Game, 'id' | 'currentPlayers' | 'players'>) => void;
  joinGame: (gameId: string, playerName: string) => void;
  leaveGame: (gameId: string, playerName: string) => void;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

const mockGames: Game[] = [
  {
    id: '1',
    sport: 'Basketball',
    title: 'Sunset 3v3 Pick-up',
    location: 'Underground Arena',
    date: 'Apr 5, 2026',
    time: '18:00',
    maxPlayers: 12,
    currentPlayers: 8,
    competitiveLevel: 'Intermediate',
    notes: 'Bring water, sneakers required. No rookies please!',
    players: ['Marcus', 'Elena', 'Jaxson', 'Sasha', 'Dante', 'Miki', 'Alex', 'Jordan'],
  },
  {
    id: '2',
    sport: 'Soccer',
    title: 'Morning Street Soccer',
    location: 'Pier 45',
    date: 'Apr 4, 2026',
    time: '08:00',
    maxPlayers: 14,
    currentPlayers: 10,
    competitiveLevel: 'Casual',
    notes: 'Just for fun, all skill levels welcome!',
    players: [
      'Marcus',
      'Elena',
      'Jaxson',
      'Sasha',
      'Dante',
      'Miki',
      'Chris',
      'Pat',
      'Sam',
      'Taylor',
    ],
  },
  {
    id: '3',
    sport: 'Skateboarding',
    title: 'Skate Jam Session',
    location: 'Harbor Park',
    date: 'Apr 6, 2026',
    time: '15:00',
    maxPlayers: 20,
    currentPlayers: 15,
    competitiveLevel: 'Pro',
    notes: 'Advanced tricks only. Helmets mandatory.',
    players: [
      'Marcus',
      'Elena',
      'Jaxson',
      'Sasha',
      'Dante',
      'Miki',
      'Alex',
      'Jordan',
      'Chris',
      'Pat',
      'Sam',
      'Taylor',
      'Morgan',
      'Casey',
      'Riley',
    ],
  },
  {
    id: '4',
    sport: 'Tennis',
    title: 'Doubles Tournament',
    location: 'City Courts',
    date: 'Apr 7, 2026',
    time: '10:00',
    maxPlayers: 8,
    currentPlayers: 4,
    competitiveLevel: 'Intermediate',
    notes: 'Bring your own racket',
    players: ['Marcus', 'Elena', 'Jaxson', 'Sasha'],
  },
  {
    id: '5',
    sport: 'Volleyball',
    title: 'Beach Volleyball Throwdown',
    location: 'Sunset Beach',
    date: 'Apr 8, 2026',
    time: '16:00',
    maxPlayers: 12,
    currentPlayers: 6,
    competitiveLevel: 'Casual',
    notes: 'Beach vibes, good times. Sunscreen recommended!',
    players: ['Elena', 'Jaxson', 'Sasha', 'Dante', 'Miki', 'Alex'],
  },
  {
    id: '6',
    sport: 'Running',
    title: '5K Morning Run',
    location: 'Central Park Loop',
    date: 'Apr 3, 2026',
    time: '06:30',
    maxPlayers: 30,
    currentPlayers: 18,
    competitiveLevel: 'Intermediate',
    notes: 'Moderate pace, 10min/mile average. Water stations available.',
    players: [
      'Marcus',
      'Elena',
      'Jaxson',
      'Sasha',
      'Dante',
      'Miki',
      'Alex',
      'Jordan',
      'Chris',
      'Pat',
      'Sam',
      'Taylor',
      'Morgan',
      'Casey',
      'Riley',
      'Avery',
      'Drew',
      'Cameron',
    ],
  },
  {
    id: '7',
    sport: 'Basketball',
    title: 'Late Night Hoops',
    location: 'Downtown Court',
    date: 'Apr 5, 2026',
    time: '21:00',
    maxPlayers: 10,
    currentPlayers: 10,
    competitiveLevel: 'Pro',
    notes: 'Competitive play. Bring your A-game!',
    players: [
      'Marcus',
      'Elena',
      'Jaxson',
      'Sasha',
      'Dante',
      'Miki',
      'Alex',
      'Jordan',
      'Chris',
      'Pat',
    ],
  },
  {
    id: '8',
    sport: 'Cycling',
    title: 'Weekend Trail Ride',
    location: 'Mountain Trail Head',
    date: 'Apr 9, 2026',
    time: '09:00',
    maxPlayers: 15,
    currentPlayers: 7,
    competitiveLevel: 'Intermediate',
    notes: 'Mountain bikes recommended. 20-mile trail.',
    players: ['Marcus', 'Elena', 'Dante', 'Miki', 'Alex', 'Jordan', 'Chris'],
  },
];

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>(mockGames);

  const addGame = (gameData: Omit<Game, 'id' | 'currentPlayers' | 'players'>) => {
    const newGame: Game = {
      ...gameData,
      id: Date.now().toString(),
      currentPlayers: 0,
      players: [],
    };
    setGames([newGame, ...games]);
  };

  const joinGame = (gameId: string, playerName: string) => {
    setGames(
      games.map((game) => {
        if (
          game.id === gameId &&
          game.currentPlayers < game.maxPlayers &&
          !game.players.includes(playerName)
        ) {
          return {
            ...game,
            currentPlayers: game.currentPlayers + 1,
            players: [...game.players, playerName],
          };
        }
        return game;
      }),
    );
  };

  const leaveGame = (gameId: string, playerName: string) => {
    setGames(
      games.map((game) => {
        if (game.id === gameId && game.players.includes(playerName)) {
          return {
            ...game,
            currentPlayers: game.currentPlayers - 1,
            players: game.players.filter((p) => p !== playerName),
          };
        }
        return game;
      }),
    );
  };

  return (
    <GamesContext.Provider value={{ games, addGame, joinGame, leaveGame }}>
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
}

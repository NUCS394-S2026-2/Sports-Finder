import type { Game } from '../types';

const inMemoryGames: Game[] = [];

export const createGame = async (
  gameData: Omit<Game, 'id' | 'createdAt' | 'players'>,
): Promise<string> => {
  const newGame: Game = {
    id: `game-${Date.now()}`,
    ...gameData,
    players: [gameData.createdBy],
    createdAt: new Date(),
  };

  inMemoryGames.push(newGame);
  return Promise.resolve(newGame.id);
};

export const getNearbyGames = async (
  latitude: number,
  longitude: number,
  radiusInMiles: number = 5,
): Promise<Game[]> => {
  const now = new Date();
  return Promise.resolve(
    inMemoryGames.filter((game) => {
      if (game.startTime <= now) return false;
      const distance = calculateDistance(
        latitude,
        longitude,
        game.location.latitude,
        game.location.longitude,
      );
      return distance <= radiusInMiles;
    }),
  );
};

export const joinGame = async (gameId: string, userId: string): Promise<void> => {
  const game = inMemoryGames.find((g) => g.id === gameId);
  if (game && !game.players.includes(userId)) {
    game.players.push(userId);
  }
  return Promise.resolve();
};

export const leaveGame = async (gameId: string, userId: string): Promise<void> => {
  const game = inMemoryGames.find((g) => g.id === gameId);
  if (game) {
    game.players = game.players.filter((id) => id !== userId);
  }
  return Promise.resolve();
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

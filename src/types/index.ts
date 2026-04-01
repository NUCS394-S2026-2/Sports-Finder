export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  gamesAttended: string[];
  createdAt: Date;
}

export interface Game {
  id: string;
  sportType: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  competitiveLevel: 'casual' | 'intermediate' | 'competitive';
  players: string[]; // User IDs
  maxPlayers: number;
  startTime: Date;
  createdBy: string; // User ID
  createdAt: Date;
  description: string;
}

export interface PlayerProfile {
  user: User;
  gamesAttendedDetails: Game[];
  favorySports: string[];
}

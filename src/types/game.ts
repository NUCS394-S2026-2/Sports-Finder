export interface Game {
  id: number;
  sport: string;
  location: string;
  dateTime: string;
  organizer: string;
  playersJoined: number;
  maxPlayers: number;
  skillLevel: string;
  ageRange: string;
  gender: string;
  notes?: string;
}
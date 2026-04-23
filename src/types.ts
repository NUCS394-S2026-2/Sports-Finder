export type SportName = 'Soccer' | 'Frisbee' | 'Tennis';

export type User = {
  name: string;
  email: string;
};

export type Player = {
  name: string;
  email: string;
};

export type PickupGame = {
  id: string;
  sport: SportName;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  organizer: string; // email
  note: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  ageRange: string;
  gender: 'Any' | 'Men' | 'Women' | 'Mixed';
  requirements: string;
  players: Player[];
};
// hi

export type GameDraft = {
  sport: SportName | '';
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  organizer: string;
  note: string;
  skillLevel: PickupGame['skillLevel'];
  ageRange: string;
  gender: PickupGame['gender'];
  requirements: string;
};

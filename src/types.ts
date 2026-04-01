export type SportName = 'Basketball' | 'Soccer' | 'Football' | 'Volleyball' | string;

export type PickupGame = {
  id: number;
  sport: SportName;
  location: string;
  startTime: string;
  capacity: number;
  spotsFilled: number;
  organizer: string;
  note: string;
};

export type GameDraft = {
  sport: string;
  location: string;
  startTime: string;
  capacity: number;
  organizer: string;
  note: string;
};

export type SportFilter = 'All' | SportName;

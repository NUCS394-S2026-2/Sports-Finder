export type SportName = 'Basketball' | 'Soccer' | 'Football' | 'Volleyball' | string;

export type PickupGame = {
  id: string;
  sport: SportName;
  location: string;
  startTime: string;
  capacity: number;
  spotsFilled: number;
  organizer: string;
  note: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  ageRange: '18-24' | '25-34' | '35-44' | '45+';
  gender: 'Open' | 'Women' | 'Men' | 'Mixed';
};

export type GameDraft = {
  sport: string;
  location: string;
  startTime: string;
  capacity: number;
  organizer: string;
  note: string;
  skillLevel: PickupGame['skillLevel'];
  ageRange: PickupGame['ageRange'];
  gender: PickupGame['gender'];
};

export type SportFilter = 'All' | SportName;

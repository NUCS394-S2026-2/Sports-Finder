export type SportName = 'Tennis' | 'Soccer' | 'Ultimate Frisbee';

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
  ageRange: '18-24' | '25-34' | '35-44' | '45+' | 'All ages';
  gender: 'All' | 'Women' | 'Men';
  attendees: string[];
};

export type GameDraft = {
  sport: SportName | '';
  location: string;
  startTime: string;
  capacity: number | '';
  organizer: string;
  note: string;
  skillLevel: PickupGame['skillLevel'];
  ageRange: PickupGame['ageRange'];
  gender: PickupGame['gender'];
};

export type SportFilter = 'All' | SportName;

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
};

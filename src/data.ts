import type { GameDraft, PickupGame, SportName } from './types';

export const featuredSports: SportName[] = [
  'Basketball',
  'Soccer',
  'Football',
  'Volleyball',
];

export const initialGames: PickupGame[] = [
  {
    id: 1,
    sport: 'Basketball',
    location: 'West Campus Courts',
    startTime: '2026-04-01T17:30',
    capacity: 10,
    spotsFilled: 7,
    organizer: 'Maya',
    note: 'Friendly run with mixed skill levels. Bring a dark and light jersey.',
    skillLevel: 'Intermediate',
    ageRange: '25-34',
    gender: 'Mixed',
  },
  {
    id: 2,
    sport: 'Soccer',
    location: 'Riverside Turf Field',
    startTime: '2026-04-01T18:15',
    capacity: 14,
    spotsFilled: 11,
    organizer: 'Jordan',
    note: 'Small-sided game with quick rotations and plenty of subs.',
    skillLevel: 'Beginner',
    ageRange: '18-24',
    gender: 'Open',
  },
  {
    id: 3,
    sport: 'Volleyball',
    location: 'Student Center Gym B',
    startTime: '2026-04-01T19:00',
    capacity: 12,
    spotsFilled: 8,
    organizer: 'Avery',
    note: 'Open gym, all levels welcome. Kneepads recommended.',
    skillLevel: 'Intermediate',
    ageRange: '35-44',
    gender: 'Women',
  },
];

export const emptyDraft: GameDraft = {
  sport: 'Basketball',
  location: '',
  startTime: '',
  capacity: 10,
  organizer: '',
  note: '',
  skillLevel: 'Beginner',
  ageRange: '25-34',
  gender: 'Open',
};

export const skillLevels: GameDraft['skillLevel'][] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const ageRanges: GameDraft['ageRange'][] = ['18-24', '25-34', '35-44', '45+'];

export const genders: GameDraft['gender'][] = ['Open', 'Women', 'Men', 'Mixed'];

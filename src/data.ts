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
  },
];

export const emptyDraft: GameDraft = {
  sport: 'Basketball',
  location: '',
  startTime: '',
  capacity: 10,
  organizer: '',
  note: '',
};

import type { GameDraft, PickupGame, SportName } from './types';

export const featuredSports: SportName[] = ['Soccer', 'Frisbee', 'Tennis'];

export type LocationInfo = {
  sports: SportName[];
  availability: 'anytime' | { [day: string]: { start: string; end: string } };
};

export const locations: { [key: string]: LocationInfo } = {
  'Hutchson Field': {
    sports: ['Soccer', 'Frisbee'],
    availability: {
      mon: { start: '18:00', end: '22:00' },
      tue: { start: '18:00', end: '22:00' },
      wed: { start: '18:00', end: '22:00' },
      thu: { start: '18:00', end: '22:00' },
      fri: { start: '18:00', end: '22:00' },
      sat: { start: '08:00', end: '21:00' },
      sun: { start: '08:00', end: '21:00' },
    },
  },
  'Deering Meadow': {
    sports: ['Frisbee'],
    availability: 'anytime',
  },
  'Northwestern Tennis Courts': {
    sports: ['Tennis'],
    availability: 'anytime',
  },
};

export const initialGames: PickupGame[] = [
  {
    id: '1',
    sport: 'Soccer',
    location: 'Hutchson Field',
    startTime: '2026-04-07T18:00',
    endTime: '2026-04-07T19:30',
    capacity: 14,
    organizer: 'maya@example.com',
    note: 'Small-sided game with quick rotations and plenty of subs.',
    skillLevel: 'Beginner',
    ageRange: '18+',
    gender: 'Mixed',
    requirements: 'Bring water and arrive a few minutes early.',
    players: [
      { name: 'Maya', email: 'maya@example.com' },
      { name: 'Jordan', email: 'jordan@example.com' },
      { name: 'Alex', email: 'alex@example.com' },
    ],
  },
  {
    id: '2',
    sport: 'Tennis',
    location: 'Northwestern Tennis Courts',
    startTime: '2026-04-07T19:00',
    endTime: '2026-04-07T20:00',
    capacity: 4,
    organizer: 'avery@example.com',
    note: 'Casual doubles match.',
    skillLevel: 'Intermediate',
    ageRange: '18+',
    gender: 'Mixed',
    requirements: 'Bring your own racket.',
    players: [
      { name: 'Avery', email: 'avery@example.com' },
      { name: 'Sam', email: 'sam@example.com' },
    ],
  },
];

export const emptyDraft: GameDraft = {
  sport: '',
  location: '',
  date: '2026-04-07',
  startTime: '',
  endTime: '',
  capacity: 10,
  organizer: '',
  note: '',
  skillLevel: 'Beginner',
  ageRange: '18+',
  gender: 'Any',
  requirements: '',
};

export const skillLevels: GameDraft['skillLevel'][] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

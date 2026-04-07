import type { GameDraft, PickupGame, SportName } from './types';

export const featuredSports: SportName[] = ['Tennis', 'Soccer', 'Ultimate Frisbee'];

export const initialGames: PickupGame[] = [
  {
    id: '1',
    sport: 'Tennis',
    location: 'Vandy (Northwestern Tennis Courts)',
    startTime: '2026-04-01T17:30',
    capacity: 10,
    spotsFilled: 7,
    organizer: 'Maya',
    note: 'Friendly run with mixed skill levels. Bring water and a racket.',
    skillLevel: 'Intermediate',
    ageRange: '25-34',
    gender: 'All',
  },
  {
    id: '2',
    sport: 'Soccer',
    location: 'Hudson Field',
    startTime: '2026-04-01T18:15',
    capacity: 14,
    spotsFilled: 11,
    organizer: 'Jordan',
    note: 'Small-sided game with quick rotations and plenty of subs.',
    skillLevel: 'Beginner',
    ageRange: '18-24',
    gender: 'All',
  },
  {
    id: '3',
    sport: 'Ultimate Frisbee',
    location: 'Hudson Field',
    startTime: '2026-04-01T19:00',
    capacity: 12,
    spotsFilled: 8,
    organizer: 'Avery',
    note: 'Open gym, all levels welcome. Bring a water bottle.',
    skillLevel: 'Intermediate',
    ageRange: '35-44',
    gender: 'All',
  },
];

export const emptyDraft: GameDraft = {
  sport: '',
  location: '',
  startTime: '',
  capacity: '',
  organizer: '',
  note: '',
  skillLevel: 'Beginner',
  ageRange: '25-34',
  gender: 'All',
};

export const skillLevels: GameDraft['skillLevel'][] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const ageRanges: GameDraft['ageRange'][] = ['18-24', '25-34', '35-44', '45+'];

export const genders: GameDraft['gender'][] = ['All', 'Women', 'Men'];

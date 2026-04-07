import type { GameDraft, PickupGame, SportName } from './types';

export const featuredSports: SportName[] = ['Soccer', 'Frisbee', 'Tennis'];

export const initialGames: PickupGame[] = [
  {
    id: '1',
    sport: 'Soccer',
    location: 'Deering Meadow',
    startTime: '2026-04-10T17:30',
    capacity: 14,
    spotsFilled: 9,
    organizer: 'Maya',
    note: 'Casual small-sided game, all levels welcome.',
    skillLevel: 'Beginner',
    ageRange: '18-24',
    gender: 'Open',
  },
  {
    id: '2',
    sport: 'Frisbee',
    location: 'Lakefill North Lawn',
    startTime: '2026-04-10T16:00',
    capacity: 12,
    spotsFilled: 5,
    organizer: 'Jordan',
    note: 'Ultimate frisbee, spirit of the game rules.',
    skillLevel: 'Intermediate',
    ageRange: '18-24',
    gender: 'Mixed',
  },
  {
    id: '3',
    sport: 'Tennis',
    location: 'Vandy Christie Tennis Center',
    startTime: '2026-04-10T18:00',
    capacity: 4,
    spotsFilled: 2,
    organizer: 'Avery',
    note: 'Doubles match, bring your own racket.',
    skillLevel: 'Intermediate',
    ageRange: '18-24',
    gender: 'Open',
  },
];

export const emptyDraft: GameDraft = {
  sport: 'Soccer',
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

export const openLocations: string[] = [
  'Deering Meadow',
  'Lakefill North Lawn',
  'Norris South Lawn',
  'Shakespeare Garden',
  'North Campus Green',
  'Hutchinson Field',
  'Vandy Christie Tennis Center',
];

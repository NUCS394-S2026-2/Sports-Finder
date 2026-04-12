import type { PickupGame, SportName } from '../types';

export function sportEmoji(sport: SportName): string {
  switch (sport) {
    case 'Soccer':
      return '⚽';
    case 'Frisbee':
      return '🥏';
    case 'Tennis':
      return '🎾';
  }
}

export function competitiveLabel(
  skill: PickupGame['skillLevel'],
): 'Casual' | 'Intermediate' | 'Competitive' {
  if (skill === 'Beginner') return 'Casual';
  if (skill === 'Advanced') return 'Competitive';
  return 'Intermediate';
}

export function skillFromCompetitive(
  label: 'Casual' | 'Intermediate' | 'Competitive',
): PickupGame['skillLevel'] {
  if (label === 'Casual') return 'Beginner';
  if (label === 'Competitive') return 'Advanced';
  return 'Intermediate';
}

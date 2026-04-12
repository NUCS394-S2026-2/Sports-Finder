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

/** Category line on home cards (Frisbee reads as in the product mock). */
export function sportHomeCategoryLabel(sport: SportName): string {
  return sport === 'Frisbee' ? 'Ultimate Frisbee' : sport;
}

/** Card title: host note when usable, else "Sport at Location". */
export function homeGameCardTitle(game: PickupGame): string {
  const n = game.note.trim();
  if (n.length >= 2 && !/^[.\-–—]+$/.test(n)) {
    const oneLine = n.split(/\n/)[0]?.trim() ?? n;
    return oneLine.length <= 72 ? oneLine : `${oneLine.slice(0, 69)}…`;
  }
  return `${game.sport} at ${game.location}`;
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

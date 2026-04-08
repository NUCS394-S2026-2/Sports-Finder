import { describe, expect, test } from 'vitest';

import { playerHasSchedulingConflict, timeRangesOverlap } from './game-time';

describe('timeRangesOverlap', () => {
  test('detects overlap', () => {
    const a = { startMs: 100, endMs: 200 };
    const b = { startMs: 150, endMs: 250 };
    expect(timeRangesOverlap(a, b)).toBe(true);
  });

  test('no overlap when one ends where other starts', () => {
    const a = { startMs: 100, endMs: 200 };
    const b = { startMs: 200, endMs: 300 };
    expect(timeRangesOverlap(a, b)).toBe(false);
  });
});

describe('playerHasSchedulingConflict', () => {
  const candidate = {
    id: 'new',
    date: 'Apr 9, 2026',
    time: '19:00',
    endTime: '20:00',
    players: [] as string[],
  };

  test('no conflict when not in other games', () => {
    expect(playerHasSchedulingConflict([candidate], 'Alex', candidate)).toBe(false);
  });

  test('conflict when same user is in overlapping game', () => {
    const other = {
      id: '1',
      date: 'Apr 9, 2026',
      time: '18:30',
      endTime: '19:30',
      players: ['Alex'],
    };
    expect(playerHasSchedulingConflict([other, candidate], 'Alex', candidate)).toBe(true);
  });

  test('no conflict when same day but times do not overlap', () => {
    const other = {
      id: '1',
      date: 'Apr 9, 2026',
      time: '16:00',
      endTime: '17:00',
      players: ['Alex'],
    };
    expect(playerHasSchedulingConflict([other, candidate], 'Alex', candidate)).toBe(
      false,
    );
  });

  test('ignores cancelled games for overlap', () => {
    const other = {
      id: '1',
      date: 'Apr 9, 2026',
      time: '18:30',
      endTime: '19:30',
      players: ['Alex'],
      cancelled: true,
    };
    expect(playerHasSchedulingConflict([other, candidate], 'Alex', candidate)).toBe(
      false,
    );
  });
});

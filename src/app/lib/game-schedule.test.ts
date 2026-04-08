import { describe, expect, test } from 'vitest';

import { applyAutoCancellation, meetsMinimumHostLead } from './game-schedule';

describe('meetsMinimumHostLead', () => {
  test('requires start at least 5 hours after now', () => {
    const now = new Date('2026-04-10T12:00:00').getTime();
    expect(meetsMinimumHostLead('2026-04-10', '17:00', now)).toBe(true);
    expect(meetsMinimumHostLead('2026-04-10', '16:59', now)).toBe(false);
  });
});

describe('applyAutoCancellation', () => {
  const base = {
    id: 'a',
    date: 'Apr 10, 2026',
    time: '14:00',
    minPlayers: 4,
    currentPlayers: 2,
  };

  test('cancels when in last 30 min before start and under min players', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const atTwentyNineMinBefore = startMs - 29 * 60 * 1000;
    const [out] = applyAutoCancellation([base], atTwentyNineMinBefore);
    expect(out.cancelled).toBe(true);
  });

  test('does not cancel before the 30-minute window', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const atThirtyOneMinBefore = startMs - 31 * 60 * 1000;
    const [out] = applyAutoCancellation([base], atThirtyOneMinBefore);
    expect(out.cancelled).toBeUndefined();
  });

  test('does not cancel when enough players', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const atTwentyNineMinBefore = startMs - 29 * 60 * 1000;
    const [out] = applyAutoCancellation(
      [{ ...base, currentPlayers: 4 }],
      atTwentyNineMinBefore,
    );
    expect(out.cancelled).toBeUndefined();
  });

  test('leaves already-cancelled games unchanged', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const atTwentyNineMinBefore = startMs - 29 * 60 * 1000;
    const cancelled = { ...base, cancelled: true as const, currentPlayers: 0 };
    const [out] = applyAutoCancellation([cancelled], atTwentyNineMinBefore);
    expect(out.cancelled).toBe(true);
    expect(out.currentPlayers).toBe(0);
  });

  test('does not cancel after the scheduled start time', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const justAfterStart = startMs + 60 * 1000;
    const [out] = applyAutoCancellation([base], justAfterStart);
    expect(out.cancelled).toBeUndefined();
  });

  test('cancellation window includes the instant 30 minutes before start (inclusive lower bound)', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const exactlyThirtyBefore = startMs - 30 * 60 * 1000;
    const [out] = applyAutoCancellation([base], exactlyThirtyBefore);
    expect(out.cancelled).toBe(true);
  });

  test('minPlayers 0 never fails the under-min check', () => {
    const startMs = Date.parse('Apr 10, 2026 14:00');
    const atTwentyNineMinBefore = startMs - 29 * 60 * 1000;
    const [out] = applyAutoCancellation(
      [{ ...base, minPlayers: 0, currentPlayers: 0 }],
      atTwentyNineMinBefore,
    );
    expect(out.cancelled).toBeUndefined();
  });
});

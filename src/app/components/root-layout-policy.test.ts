import { describe, expect, test } from 'vitest';

import { pathRequiresAuth } from './root-layout';

describe('pathRequiresAuth', () => {
  test('public: home, games list, game detail, sign-in', () => {
    expect(pathRequiresAuth('/home')).toBe(false);
    expect(pathRequiresAuth('/games')).toBe(false);
    expect(pathRequiresAuth('/games/123')).toBe(false);
    expect(pathRequiresAuth('/sign-in')).toBe(false);
  });

  test('protected: host, profile, notifications (exact and nested)', () => {
    expect(pathRequiresAuth('/add-game')).toBe(true);
    expect(pathRequiresAuth('/profile')).toBe(true);
    expect(pathRequiresAuth('/profile/settings')).toBe(true);
    expect(pathRequiresAuth('/notifications')).toBe(true);
    expect(pathRequiresAuth('/notifications/system')).toBe(true);
  });
});

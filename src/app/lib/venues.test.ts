import { describe, expect, test } from 'vitest';

import { DEERING_MEADOW, HUTCHINSON_FIELD, NORTHWESTERN_TENNIS_COURTS } from './venues';

describe('supported campus venues', () => {
  test('only NU pickup venues from product spec', () => {
    expect(HUTCHINSON_FIELD.name).toContain('Hutchinson');
    expect(DEERING_MEADOW.name).toContain('Deering');
    expect(NORTHWESTERN_TENNIS_COURTS.name).toMatch(/Tennis/i);
  });

  test('venues used in host form and seed data have addresses', () => {
    for (const v of [HUTCHINSON_FIELD, DEERING_MEADOW, NORTHWESTERN_TENNIS_COURTS]) {
      expect(v.address.length).toBeGreaterThan(5);
    }
  });
});

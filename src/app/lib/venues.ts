/** Supported pickup locations — only these courts/fields are bookable in the app. */

export const HUTCHINSON_FIELD = {
  name: 'Hutchinson Field',
  address: 'Sheridan Rd & Lincoln St, Evanston, IL',
  /** Mon–Fri 6pm–10pm, Sat–Sun 8am–9pm */
  hoursLine: 'Mon–Fri 6:00–10:00 PM · Sat–Sun 8:00 AM–9:00 PM',
} as const;

export const DEERING_MEADOW = {
  name: 'Deering Meadow',
  address: 'Sheridan Rd & Arts Cir Dr, Evanston, IL',
  hoursLine: 'Available anytime',
} as const;

export const NORTHWESTERN_TENNIS_COURTS = {
  name: 'Northwestern Tennis Courts',
  address: '2311 Campus Dr, Evanston, IL',
  hoursLine: 'Available anytime',
} as const;

/** `isoDate` = YYYY-MM-DD from a date input; `startHm` / `endHm` = HH:mm */
export function isWithinHutchinsonHours(
  isoDate: string,
  startHm: string,
  endHm: string,
): boolean {
  if (!isoDate || !startHm || !endHm) return false;
  const d = new Date(`${isoDate}T12:00:00`);
  const dow = d.getDay();
  const toMin = (hm: string) => {
    const [h, m] = hm.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const s = toMin(startHm);
  const e = toMin(endHm);
  if (e < s) return false;
  const weekend = dow === 0 || dow === 6;
  if (weekend) {
    return s >= 8 * 60 && e <= 21 * 60;
  }
  return s >= 18 * 60 && e <= 22 * 60;
}

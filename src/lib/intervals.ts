/** Poll cadences (ms) for the live tiles, kept in one place so they're easy to
 *  see and tune together rather than scattered one-per-file. */
export const POLL = {
  weather: 12 * 60_000,
  airQuality: 30 * 60_000,
  markets: 8 * 60_000,
  holidays: 6 * 60 * 60_000,
  onThisDay: 6 * 60 * 60_000,
  countries: 24 * 60 * 60_000,
} as const

/**
 * Whether the overnight dimming window is active at the given local hour.
 * Handles windows that wrap past midnight (e.g. start 23 → end 6).
 * A zero-length window (start === end) is treated as "never".
 */
export function isDimActive(hour: number, start: number, end: number): boolean {
  if (start === end) return false
  if (start < end) return hour >= start && hour < end
  return hour >= start || hour < end
}

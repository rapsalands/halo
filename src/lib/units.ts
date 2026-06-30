import type { Units } from '../store/defaults'

export const toFahrenheit = (c: number) => Math.round((c * 9) / 5 + 32)

/** A Celsius temperature expressed in the chosen unit (whole degrees in
 *  imperial; Celsius passes through unrounded, matching the feeds). */
export function tempIn(c: number, units: Units): number {
  return units === 'imperial' ? toFahrenheit(c) : c
}

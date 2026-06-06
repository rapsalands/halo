const SYNODIC = 29.53058867 // days in a lunation
// Reference new moon: 2000-01-06 18:14 UTC as a Julian-style epoch in ms.
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0)
const DAY_MS = 86_400_000

export interface MoonPhase {
  fraction: number // 0..1 position in the cycle (0 = new, 0.5 = full)
  illumination: number // 0..1 fraction of disc lit
  name: string
}

const NAMES: [number, string][] = [
  [0.0625, 'New Moon'],
  [0.1875, 'Waxing Crescent'],
  [0.3125, 'First Quarter'],
  [0.4375, 'Waxing Gibbous'],
  [0.5625, 'Full Moon'],
  [0.6875, 'Waning Gibbous'],
  [0.8125, 'Last Quarter'],
  [0.9375, 'Waning Crescent'],
]

export function moonPhase(date: Date): MoonPhase {
  const days = (date.getTime() - REF_NEW_MOON) / DAY_MS
  let fraction = (days / SYNODIC) % 1
  if (fraction < 0) fraction += 1
  // Illumination: 0 at new, 1 at full, back to 0 — cosine curve.
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2
  let name = 'New Moon'
  for (const [edge, label] of NAMES) {
    if (fraction < edge) { name = label; break }
    name = 'New Moon' // wraps past 0.9375 back to New
  }
  return { fraction, illumination, name }
}

export function isDaytime(now: Date, sunrise: Date, sunset: Date): boolean {
  return now >= sunrise && now < sunset
}

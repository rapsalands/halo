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

const RAD = Math.PI / 180

/**
 * Sunrise/sunset (UTC instants) for a date and location, via the standard
 * sunrise equation. Returns nulls during polar day/night. Used by providers
 * (e.g. NWS) whose APIs don't supply sun times.
 */
export function sunTimes(date: Date, lat: number, lon: number): { sunrise: Date | null; sunset: Date | null } {
  const jd = date.getTime() / DAY_MS + 2440587.5
  const n = Math.ceil(jd - 2451545.0 + 0.0008)
  const Jstar = n - lon / 360 // mean solar time (lon east-positive)
  const M = (357.5291 + 0.98560028 * Jstar) % 360
  const Mr = M * RAD
  const C = 1.9148 * Math.sin(Mr) + 0.02 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr)
  const lambda = (M + C + 180 + 102.9372) % 360
  const lr = lambda * RAD
  const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lr)
  const sinDecl = Math.sin(lr) * Math.sin(23.4397 * RAD)
  const cosDecl = Math.cos(Math.asin(sinDecl))
  const latR = lat * RAD
  const cosOmega = (Math.sin(-0.833 * RAD) - Math.sin(latR) * sinDecl) / (Math.cos(latR) * cosDecl)
  if (cosOmega > 1) return { sunrise: null, sunset: null } // sun never rises
  if (cosOmega < -1) return { sunrise: null, sunset: null } // sun never sets
  const omega = Math.acos(cosOmega) / RAD
  const fromJulian = (j: number) => new Date((j - 2440587.5) * DAY_MS)
  return { sunrise: fromJulian(Jtransit - omega / 360), sunset: fromJulian(Jtransit + omega / 360) }
}

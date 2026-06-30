export type DayPart = 'dawn' | 'day' | 'dusk' | 'night'

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

/** YYYY-MM-DD for the given year / 0-indexed month / day. */
function isoYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** "MM-DD" for a date (host-local) — the key for day-of-year data sets. */
export function monthDayKey(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Short weekday name for a date-only string, read as a LOCAL calendar date.
 *  Parsing the components avoids the UTC-midnight shift that `new Date(str)`
 *  causes (which mislabels every day for hosts west of UTC). */
export function weekdayShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return WEEKDAYS_SHORT[new Date(y, m - 1, d).getDay()]
}

/** The calendar date (year / 0-indexed month / day) of `date` in the given IANA
 *  zone — or host-local with no zone. Lets the calendar/quote agree with the
 *  clock on which day it is when the host zone differs from the location. */
export function zonedYmd(date: Date, timeZone?: string): { year: number; month: number; day: number; iso: string } {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(date)
      const p = Object.fromEntries(parts.map((x) => [x.type, x.value])) as Record<string, string>
      const year = Number(p.year), month = Number(p.month) - 1, day = Number(p.day)
      return { year, month, day, iso: isoYmd(year, month, day) }
    } catch { /* unknown zone — fall through to host-local */ }
  }
  const year = date.getFullYear(), month = date.getMonth(), day = date.getDate()
  return { year, month, day, iso: isoYmd(year, month, day) }
}

// Intl.DateTimeFormat construction is one of the more expensive JS ops, and the
// clock calls zonedParts up to once a second; cache one formatter per zone so a
// 24/7 kiosk constructs it once rather than ~259k times/day.
const fmtCache = new Map<string, Intl.DateTimeFormat>()
function zonedFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = fmtCache.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      weekday: 'long', month: 'numeric', day: 'numeric',
    })
    fmtCache.set(timeZone, f)
  }
  return f
}

/**
 * Calendar/clock parts for `date` in the given IANA `timeZone`. With no timeZone
 * it falls back to the host's local zone (legacy behaviour), so callers without a
 * configured location are unaffected.
 */
function zonedParts(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(),
      weekday: date.getDay(), month: date.getMonth(), day: date.getDate(),
    }
  }
  try {
    const parts = zonedFormatter(timeZone).formatToParts(date)
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value])) as Record<string, string>
    return {
      hour: Number(p.hour) % 24,
      minute: Number(p.minute),
      second: Number(p.second),
      weekday: WEEKDAYS.indexOf(p.weekday),
      month: Number(p.month) - 1,
      day: Number(p.day),
    }
  } catch {
    return {
      hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(),
      weekday: date.getDay(), month: date.getMonth(), day: date.getDate(),
    }
  }
}

export function formatClock(date: Date, hour12: boolean, timeZone?: string, seconds = false): string {
  const { hour, minute, second } = zonedParts(date, timeZone)
  let h = hour
  const m = minute.toString().padStart(2, '0')
  const s = seconds ? `:${second.toString().padStart(2, '0')}` : ''
  if (hour12) {
    const suffix = hour < 12 ? 'AM' : 'PM'
    h = h % 12
    if (h === 0) h = 12
    return `${h}:${m}${s} ${suffix}`
  }
  return `${h.toString().padStart(2, '0')}:${m}${s}`
}

/** Time-of-day greeting for the given instant in an optional timezone. */
export function greeting(date: Date, timeZone?: string): string {
  const { hour } = zonedParts(date, timeZone)
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

export function formatLongDate(date: Date, timeZone?: string): string {
  const { weekday, month, day } = zonedParts(date, timeZone)
  return `${WEEKDAYS[weekday]} · ${MONTHS[month]} ${day}`
}

const WINDOW_MS = 45 * 60_000 // dawn/dusk window around sun events

export function timeOfDay(now: Date, sunrise: Date, sunset: Date): DayPart {
  const t = now.getTime()
  if (Math.abs(t - sunrise.getTime()) <= WINDOW_MS) return 'dawn'
  if (Math.abs(t - sunset.getTime()) <= WINDOW_MS) return 'dusk'
  if (t > sunrise.getTime() && t < sunset.getTime()) return 'day'
  return 'night'
}

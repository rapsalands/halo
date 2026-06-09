export type DayPart = 'dawn' | 'day' | 'dusk' | 'night'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

/**
 * Calendar/clock parts for `date` in the given IANA `timeZone`. With no timeZone
 * it falls back to the host's local zone (legacy behaviour), so callers without a
 * configured location are unaffected.
 */
function zonedParts(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      hour: date.getHours(), minute: date.getMinutes(),
      weekday: date.getDay(), month: date.getMonth(), day: date.getDate(),
    }
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      hour: '2-digit', minute: '2-digit', weekday: 'long', month: 'numeric', day: 'numeric',
    }).formatToParts(date)
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value])) as Record<string, string>
    return {
      hour: Number(p.hour) % 24,
      minute: Number(p.minute),
      weekday: WEEKDAYS.indexOf(p.weekday),
      month: Number(p.month) - 1,
      day: Number(p.day),
    }
  } catch {
    return {
      hour: date.getHours(), minute: date.getMinutes(),
      weekday: date.getDay(), month: date.getMonth(), day: date.getDate(),
    }
  }
}

export function formatClock(date: Date, hour12: boolean, timeZone?: string): string {
  const { hour, minute } = zonedParts(date, timeZone)
  let h = hour
  const m = minute.toString().padStart(2, '0')
  if (hour12) {
    h = h % 12
    if (h === 0) h = 12
    return `${h}:${m}`
  }
  return `${h.toString().padStart(2, '0')}:${m}`
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

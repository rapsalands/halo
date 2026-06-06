export type DayPart = 'dawn' | 'day' | 'dusk' | 'night'

export function formatClock(date: Date, hour12: boolean): string {
  let h = date.getHours()
  const m = date.getMinutes().toString().padStart(2, '0')
  if (hour12) {
    h = h % 12
    if (h === 0) h = 12
    return `${h}:${m}`
  }
  return `${h.toString().padStart(2, '0')}:${m}`
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} · ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

const WINDOW_MS = 45 * 60_000 // dawn/dusk window around sun events

export function timeOfDay(now: Date, sunrise: Date, sunset: Date): DayPart {
  const t = now.getTime()
  if (Math.abs(t - sunrise.getTime()) <= WINDOW_MS) return 'dawn'
  if (Math.abs(t - sunset.getTime()) <= WINDOW_MS) return 'dusk'
  if (t > sunrise.getTime() && t < sunset.getTime()) return 'day'
  return 'night'
}

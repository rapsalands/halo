/** Format a UTC instant as a naive local "YYYY-MM-DDTHH:mm" in `timeZone`,
 *  matching the local-time strings the clock/sun tiles expect. */
export function toLocalIso(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = (t: string) => parts.find((p) => p.type === t)!.value
  const hh = g('hour') === '24' ? '00' : g('hour')
  return `${g('year')}-${g('month')}-${g('day')}T${hh}:${g('minute')}`
}

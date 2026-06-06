/** Milliseconds from `now` until the next local `hour`:00:00. */
export function msUntilNextReload(now: Date, hour: number): number {
  const target = new Date(now)
  target.setHours(hour, 0, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

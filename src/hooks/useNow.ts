import { useMemo } from 'react'
import { useAppState } from '../store/appState'
import { isoOf } from '../lib/calendar'

/**
 * The shared clock, coarsened so a component re-renders only at the granularity
 * it actually needs instead of 60×/minute. `useClock` ticks `now` once a second;
 * subscribing to a *derived key* (not the raw Date) means Zustand only triggers a
 * render when that key crosses a boundary — the dominant steady-state CPU win on
 * the 24/7 Pi. The returned Date is memoized on the key, so its reference is
 * stable between ticks within the same boundary.
 */
export function useNowTick(seconds: boolean): Date {
  const div = seconds ? 1000 : 60_000
  const key = useAppState((s) => Math.floor(s.now.getTime() / div))
  return useMemo(() => new Date(key * div), [key, div])
}

/** The current local hour (0–23); re-renders at most ~24×/day. */
export function useLocalHour(): number {
  return useAppState((s) => s.now.getHours())
}

/** Today's local date parts; re-renders only when the local day rolls over. */
export function useToday(): { year: number; month: number; day: number; iso: string } {
  const iso = useAppState((s) => isoOf(s.now))
  return useMemo(() => {
    const [year, month, day] = iso.split('-').map(Number)
    return { year, month: month - 1, day, iso }
  }, [iso])
}

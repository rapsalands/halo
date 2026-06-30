import { usePolledData, type PolledState } from './usePolledData'
import { POLL } from '../lib/intervals'
import { monthDayKey } from '../lib/time'
import { fetchOnThisDay, type OnThisDay } from '../services/onThisDayService'

/** A notable "on this day" event for the given date (keyed by MM-DD). */
export function useOnThisDay(date: Date): PolledState<OnThisDay | null> {
  return usePolledData<OnThisDay | null>(
    `onthisday:${monthDayKey(date)}`,
    () => fetchOnThisDay(date),
    POLL.onThisDay,
  )
}

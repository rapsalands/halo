import { usePolledData, type PolledState } from './usePolledData'
import { POLL } from '../lib/intervals'
import { fetchHolidays, type Holiday } from '../services/holidaysService'

/** Public holidays for a year + country, last-known-good cached and re-polled. */
export function useHolidays(year: number, country: string): PolledState<Holiday[]> {
  return usePolledData<Holiday[]>(
    `holidays:${year}:${country}`,
    () => fetchHolidays(year, country),
    POLL.holidays,
  )
}

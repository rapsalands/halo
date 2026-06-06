import { useEffect } from 'react'
import { msUntilNextReload } from '../lib/reload'

/** Reloads the page once at the next local `hour`:00 to avoid memory creep. */
export function useNightlyReload(hour = 3) {
  useEffect(() => {
    const delay = msUntilNextReload(new Date(), hour)
    const id = setTimeout(() => window.location.reload(), delay)
    return () => clearTimeout(id)
  }, [hour])
}

import { useEffect } from 'react'
import { useAppState } from '../store/appState'

/** Ticks the shared `now` once per second. Mount once near the app root. */
export function useClock() {
  const setNow = useAppState((s) => s.setNow)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [setNow])
}

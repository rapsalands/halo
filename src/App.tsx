import { useEffect } from 'react'
import { useClock } from './hooks/useClock'
import { useSettings } from './store/settings'
import { useAppState } from './store/appState'
import { BackgroundEngine } from './background/BackgroundEngine'
import { LayoutRenderer } from './layout/LayoutRenderer'
import { fetchWithFallback } from './lib/fetchWithFallback'
import { ipLocate } from './data/geo'
import { fetchWeather } from './data/weather'

const WEATHER_INTERVAL = 12 * 60_000 // 12 minutes

export default function App() {
  useClock()
  const performance = useSettings((s) => s.settings.performance)
  const configuredLocation = useSettings((s) => s.settings.location)

  // Load persisted settings once.
  useEffect(() => { useSettings.getState().load() }, [])

  // Resolve location: use configured, else IP-detect (cached).
  useEffect(() => {
    let cancelled = false
    async function resolve() {
      if (configuredLocation) {
        useAppState.getState().setLocation(configuredLocation)
        return
      }
      try {
        const res = await fetchWithFallback('geo', ipLocate)
        if (!cancelled) useAppState.getState().setLocation(res.data)
      } catch {
        // Last resort default so the app still renders a scene.
        if (!cancelled) useAppState.getState().setLocation({ lat: 28.61, lon: 77.21, name: 'Delhi' })
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [configuredLocation])

  // Poll weather whenever the location changes, then on an interval.
  const location = useAppState((s) => s.location)
  useEffect(() => {
    if (!location) return
    let cancelled = false
    async function poll() {
      try {
        const res = await fetchWithFallback('weather', () => fetchWeather(location!))
        if (!cancelled) useAppState.getState().setWeather({ ...res.data, stale: res.stale })
      } catch {
        /* no cache yet and network failed — background shows its default scene */
      }
    }
    poll()
    const id = setInterval(poll, WEATHER_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [location])

  return (
    <div className={performance === 'low' ? 'perf-low' : undefined} style={{ position: 'absolute', inset: 0 }}>
      <BackgroundEngine />
      <LayoutRenderer />
    </div>
  )
}

import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { useClock } from './hooks/useClock'
import { useSettings } from './store/settings'
import { useAppState, type Weather } from './store/appState'
import { BackgroundEngine } from './background/BackgroundEngine'
import { NightDim } from './background/NightDim'
import { LayoutRenderer } from './layout/LayoutRenderer'
import { WeatherEffectsOverlay } from './background/WeatherEffectsOverlay'
import { fetchWithFallback } from './lib/fetchWithFallback'
import { ipLocate } from './data/geo'
import { fetchWeather } from './data/weather'
import { SettingsPanel } from './settings/SettingsPanel'
import { StaleBadge } from './tiles/StaleBadge'
import { useNightlyReload } from './hooks/useNightlyReload'
import { readConfigFromSearch, readLocationFromSearch } from './settings/configIO'
import { parseDemoName, overrideFor, applyDemo, synthDemoWeather } from './lib/demo'

const WEATHER_INTERVAL = 12 * 60_000 // 12 minutes

export default function App() {
  useClock()
  useNightlyReload(3)
  const performance = useSettings((s) => s.settings.performance)
  const configuredLocation = useSettings((s) => s.settings.location)
  const preview = useSettings((s) => s.settings.preview)
  const accent = useSettings((s) => s.settings.accent)

  // Latest real (fetched) weather; the displayed weather may be a preview override.
  const realWeather = useRef<Weather | null>(null)

  // Push the right weather into the store given the current preview selection.
  const applyDisplayed = useCallback(() => {
    const override = overrideFor(useSettings.getState().settings.preview)
    const real = realWeather.current
    if (!override) { if (real) useAppState.getState().setWeather(real); return }
    useAppState.getState().setWeather(real ? applyDemo(real, override) : synthDemoWeather(override, new Date()))
  }, [])

  // Load persisted settings once; ?config=, ?lat/?lon and ?demo= params override
  // for this screen. ?lat/?lon is the DashMate kiosk's location hand-off (wins
  // over a persisted/config location since it's applied last).
  useEffect(() => {
    useSettings.getState().load()
    const fromUrl = readConfigFromSearch(window.location.search)
    if (fromUrl) useSettings.getState().update(fromUrl)
    const fromLoc = readLocationFromSearch(window.location.search)
    if (fromLoc) useSettings.getState().update(fromLoc)
    const demoName = parseDemoName(window.location.search)
    if (demoName) useSettings.getState().update({ preview: demoName })
  }, [])

  // Re-apply whenever the preview selection changes.
  useEffect(() => { applyDisplayed() }, [preview, applyDisplayed])

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
        if (cancelled) return
        realWeather.current = { ...res.data, stale: res.stale }
        applyDisplayed() // honours the current preview selection
      } catch {
        /* no cache yet and network failed — background shows its default scene */
      }
    }
    poll()
    const id = setInterval(poll, WEATHER_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [location, applyDisplayed])

  return (
    <div
      className={performance === 'low' ? 'perf-low' : undefined}
      style={{ position: 'absolute', inset: 0, '--accent': accent } as CSSProperties}
    >
      <BackgroundEngine />
      <LayoutRenderer />
      <WeatherEffectsOverlay />
      <NightDim />
      <StaleBadge />
      <SettingsPanel />
    </div>
  )
}

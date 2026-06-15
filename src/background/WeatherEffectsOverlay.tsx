import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { resolveScene } from './scene'
import { ParticleCanvas } from './ParticleCanvas'
import { Lightning } from './Lightning'

/** Full-screen weather effects rendered above the grid (rain/snow/stars + thunder). */
export function WeatherEffectsOverlay() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const performance = useSettings((s) => s.settings.performance)
  const { scene } = resolveScene(weather, now)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      <ParticleCanvas scene={scene} performance={performance} />
      {scene === 'thunder' && <Lightning />}
    </div>
  )
}

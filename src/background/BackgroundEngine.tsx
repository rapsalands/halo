import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { selectScene } from './scene'
import { SkyGradient } from './SkyGradient'
import { ParticleCanvas } from './ParticleCanvas'
import { Celestial } from './Celestial'

export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const performance = useSettings((s) => s.settings.performance)

  // Sensible default before the first weather load.
  const fallback = { sky: ['#1a2238', '#2a3658'] as [string, string], scene: 'cloudy' as const }
  const result = weather ? selectScene(weather, now) : null
  const sky = result?.palette.sky ?? fallback.sky
  const scene = result?.scene ?? fallback.scene

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <SkyGradient sky={sky} />
      <Celestial scene={scene} now={now} />
      <ParticleCanvas scene={scene} performance={performance} />
    </div>
  )
}

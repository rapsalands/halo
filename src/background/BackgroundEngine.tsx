import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { selectScene } from './scene'
import { SkyGradient } from './SkyGradient'
import { ParticleCanvas } from './ParticleCanvas'
import { Celestial } from './Celestial'
import { Clouds } from './Clouds'
import { AuroraGlow } from './AuroraGlow'
import { Lightning } from './Lightning'
import { PhotoBackdrop } from './PhotoBackdrop'

export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const performance = useSettings((s) => s.settings.performance)
  const backgroundMode = useSettings((s) => s.settings.backgroundMode)

  // Sensible default before the first weather load.
  const fallback = {
    sky: ['#1a2238', '#2a3658'] as [string, string],
    scene: 'cloudy' as const,
    accent: '#7fd0ff',
  }
  const result = weather ? selectScene(weather, now) : null
  const sky = result?.palette.sky ?? fallback.sky
  const scene = result?.scene ?? fallback.scene
  const accent = result?.palette.accent ?? fallback.accent
  const photoMode = backgroundMode === 'photo'

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {photoMode ? (
        <PhotoBackdrop />
      ) : (
        <>
          <SkyGradient sky={sky} accent={accent} />
          <AuroraGlow accent={accent} />
          <Celestial scene={scene} now={now} />
          <Clouds scene={scene} />
        </>
      )}
      {/* weather particles drift on top in both modes for cohesion */}
      <ParticleCanvas scene={scene} performance={performance} />
      {scene === 'thunder' && <Lightning />}
    </div>
  )
}

import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { resolveScene } from './scene'
import { SkyGradient } from './SkyGradient'
import { Celestial } from './Celestial'
import { Clouds } from './Clouds'
import { AuroraGlow } from './AuroraGlow'
import { PhotoBackdrop } from './PhotoBackdrop'

export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const backgroundMode = useSettings((s) => s.settings.backgroundMode)
  const { sky, scene, accent, night } = resolveScene(weather, now)
  const photoMode = backgroundMode === 'photo'

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {photoMode ? (
        <PhotoBackdrop />
      ) : (
        <>
          <SkyGradient sky={sky} accent={accent} />
          <AuroraGlow accent={accent} />
          <Celestial scene={scene} now={now} night={night} />
          <Clouds scene={scene} />
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAppState } from '../store/appState'
import { resolveScene } from './scene'
import { sceneImage } from './sceneImage'

/**
 * Full-screen weather/time backdrop image. The toned scene gradient sits behind
 * as a base (and as the fallback if the image fails to load), with a soft scrim
 * on top so the translucent glass widgets stay legible. The opaque photo panel
 * covers the right portion; rain/snow effects overlay everything above.
 */
export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const { sky, scene } = resolveScene(weather, now)
  const img = sceneImage(scene)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [img])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {/* Toned gradient base — also the fallback if the image can't load. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 100%)`,
          transition: 'background 1.5s ease',
        }}
      />
      {!failed && (
        <img
          key={img}
          src={img}
          alt=""
          onError={() => setFailed(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', animation: 'halo-bg-fade 1.6s ease',
          }}
        />
      )}
      {/* Legibility scrim under the translucent widgets. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(8,12,22,0.30) 0%, rgba(8,12,22,0.52) 100%)',
        }}
      />
      <style>{`@keyframes halo-bg-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}

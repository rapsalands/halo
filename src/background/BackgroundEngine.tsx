import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppState } from '../store/appState'
import { resolveScene } from './scene'
import { sceneImages } from './sceneImage'
import { SkyCompanion } from './SkyCompanion'

/** Very slow background rotation — much gentler than the photo frame. */
const BG_ROTATE_MS = 75_000

/**
 * Full-screen weather/time backdrop: a slow cross-fading Ken-Burns slideshow of
 * several images for the current scene. The toned scene gradient sits behind as
 * the base/fallback, with a soft scrim on top so the translucent glass widgets
 * stay legible. The opaque photo panel covers the right portion; rain/snow
 * effects overlay everything above.
 */
export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const { sky, scene } = resolveScene(weather, now)
  const images = sceneImages(scene)
  const [i, setI] = useState(0)

  // Restart the rotation whenever the scene's image set changes.
  useEffect(() => { setI(0) }, [scene])
  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setI((n) => (n + 1) % images.length), BG_ROTATE_MS)
    return () => clearInterval(id)
  }, [images.length, scene])

  const src = images[i % images.length]

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {/* Toned gradient base — also the fallback if an image can't load. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 100%)`,
          transition: 'background 1.5s ease',
        }}
      />
      <AnimatePresence>
        <motion.img
          key={src}
          src={src}
          alt=""
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.09 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 2.6, ease: 'easeInOut' },
            scale: { duration: BG_ROTATE_MS / 1000, ease: 'linear' },
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AnimatePresence>
      {/* Legibility scrim under the translucent widgets. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(8,12,22,0.30) 0%, rgba(8,12,22,0.52) 100%)',
        }}
      />
      {/* whimsical sun/moon drifting slowly across the sky */}
      <SkyCompanion />
    </div>
  )
}

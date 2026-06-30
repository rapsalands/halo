import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { useNowTick } from '../hooks/useNow'
import { resolveScene } from './scene'
import { sceneImages } from './sceneImage'
import { SkyAnimation } from './SkyAnimation'

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
  // Scene changes a few times a day at most — minute granularity, not per second.
  const now = useNowTick(false)
  const performance = useSettings((s) => s.settings.performance)
  const { sky, scene } = resolveScene(weather, now)
  const images = useMemo(() => sceneImages(scene), [scene])

  const [i, setI] = useState(0)
  // Restart the rotation when the scene's image set changes. Done during render
  // (React's adjust-state-on-change pattern) rather than a setState-in-effect.
  const [shownScene, setShownScene] = useState(scene)
  if (scene !== shownScene) { setShownScene(scene); setI(0) }
  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setI((n) => (n + 1) % images.length), BG_ROTATE_MS)
    return () => clearInterval(id)
  }, [images.length, scene])

  const src = images[i % images.length]
  const zoom = performance === 'high'

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
          animate={{ opacity: 1, scale: zoom ? 1.09 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 2.6, ease: 'easeInOut' },
            // Skip the perpetual full-screen Ken-Burns zoom on Low (it forces a
            // continuous large-layer recomposite); keep just the opacity crossfade.
            ...(zoom ? { scale: { duration: BG_ROTATE_MS / 1000, ease: 'linear' } } : {}),
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
      <SkyAnimation />
    </div>
  )
}

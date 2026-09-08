import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useSettings } from '../store/settings'
import { photoSequence } from '../services/photosService'

const ROTATE_MS = 9000 // visibly cycle the slideshow
/** The zoom drifts for this long after each change, then holds still — see the
 *  same constant in BackgroundEngine for why it is not the whole interval. */
const ZOOM_MS = 4000

/** Opaque photo feature panel for the right column — a slow cross-fading
 *  slideshow. Interim source is Picsum so the frame is visibly a slideshow;
 *  Plan 2 swaps this for the iris slideshow driven by the user's own folders. */
export function PhotoPanel() {
  const photos = useMemo(() => photoSequence(8, 1000, 1500), [])
  const reduceMotion = useReducedMotion()
  const zoom = useSettings((s) => s.settings.performance) === 'high' && !reduceMotion
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % photos.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [photos.length])

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius: 18, overflow: 'hidden', background: '#0b0f1a',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
      }}
    >
      <AnimatePresence>
        <motion.img
          key={photos[i]}
          src={photos[i]}
          alt=""
          initial={{ opacity: 0, scale: zoom ? 1.06 : 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2 },
            // Drop the zoom on Low performance or under reduced motion.
            ...(zoom ? { scale: { duration: ZOOM_MS / 1000, ease: 'linear' } } : {}),
          }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AnimatePresence>
    </div>
  )
}

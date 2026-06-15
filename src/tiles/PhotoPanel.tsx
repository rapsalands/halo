import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { photoSequence } from '../data/photos'

const ROTATE_MS = 9000 // visibly cycle the slideshow

/** Opaque photo feature panel for the right column — a slow cross-fading
 *  slideshow. Interim source is Picsum so the frame is visibly a slideshow;
 *  Plan 2 swaps this for the iris slideshow driven by the user's own folders. */
export function PhotoPanel() {
  const photos = photoSequence(8, 1000, 1500)
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
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: ROTATE_MS / 1000, ease: 'linear' } }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AnimatePresence>
    </div>
  )
}

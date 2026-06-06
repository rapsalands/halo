import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { photoSequence } from '../data/photos'

const ROTATE_MS = 3 * 60_000 // new photo every 3 minutes

export function PhotoBackdrop() {
  const photos = photoSequence(8, window.innerWidth, window.innerHeight)
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % photos.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [photos.length])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b0f1a' }}>
      <AnimatePresence>
        <motion.img
          key={photos[i]}
          src={photos[i]}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.5 }, scale: { duration: ROTATE_MS / 1000, ease: 'linear' } }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AnimatePresence>
      {/* darkening scrim so glass tiles stay legible over bright photos */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }} />
    </div>
  )
}

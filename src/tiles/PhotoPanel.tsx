import hero from '../assets/hero.png'

/** Opaque photo feature panel for the right column. Placeholder until the iris
 *  slideshow is wired in (Plan 2 swaps the inner <img> for <PhotoSlideshow/>). */
export function PhotoPanel() {
  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius: 18, overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
      }}
    >
      <img src={hero} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

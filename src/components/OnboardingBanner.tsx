import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

/** Rolling hints shown to a first-time kiosk user. Add freely — the banner
 * cross-fades through them. Copy is customer-facing (KioskMate). */
const HINTS = [
  'Swipe down with two fingers to open System Settings and set up your KioskMate',
  'Tap the settings icon (top-right) to change this dashboard',
]

const ROTATE_MS = 7000

/** Fixed-bottom onboarding banner. Visible until the user dismisses it (which
 * persists via the showOnboardingBanner setting) or turns it off in settings. */
export function OnboardingBanner() {
  const show = useSettings((s) => s.settings.showOnboardingBanner)
  const update = useSettings((s) => s.update)
  const editMode = useAppState((s) => s.editMode)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!show || HINTS.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % HINTS.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [show])

  // Hidden while editing the layout: it overlaps the bottom row and would block
  // the ticker's resize handle.
  if (!show || editMode) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 44px',
        background: 'rgba(0, 0, 0, 0.45)',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45 }}
          style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' }}
        >
          {HINTS[i]}
        </motion.span>
      </AnimatePresence>
      <button
        type="button"
        aria-label="Hide this banner"
        onClick={() => update({ showOnboardingBanner: false })}
        style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 0, cursor: 'pointer',
          color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.2rem', lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}

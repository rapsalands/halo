import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { isDimActive } from '../lib/dim'

/**
 * A warm, dark scrim that fades in during the configured overnight window so a
 * 24/7 wall panel isn't blasting cold light into a dark room. Pointer-through,
 * sits above tiles but below the settings panel so it stays configurable.
 */
export function NightDim() {
  const enabled = useSettings((s) => s.settings.nightDim)
  const start = useSettings((s) => s.settings.dimStart)
  const end = useSettings((s) => s.settings.dimEnd)
  const now = useAppState((s) => s.now)

  const active = enabled && isDimActive(now.getHours(), start, end)
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none',
        background: 'radial-gradient(140% 120% at 50% 40%, rgba(20,10,0,0.55), rgba(0,0,0,0.78))',
        opacity: active ? 1 : 0,
        transition: 'opacity 2.5s ease',
      }}
    />
  )
}

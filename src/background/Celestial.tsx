import { moonPhase } from '../lib/sun'
import type { Scene } from '../lib/weatherCodes'

interface Props { scene: Scene; now: Date }

/** A sun for clear-day, a phase-lit moon for clear-night. Nothing otherwise. */
export function Celestial({ scene, now }: Props) {
  if (scene === 'clear-day') {
    return (
      <div style={{
        position: 'absolute', top: '12%', right: '14%', width: 120, height: 120,
        borderRadius: '50%', background: 'radial-gradient(circle, #fff7d6, #ffd86b)',
        boxShadow: '0 0 120px 40px rgba(255, 216, 107, 0.6)',
      }} />
    )
  }
  if (scene === 'clear-night') {
    const { illumination } = moonPhase(now)
    // Shadow offset fakes the lit fraction.
    const shadow = `inset ${(-40 + illumination * 80).toFixed(0)}px 0 30px 4px rgba(8,10,22,0.92)`
    return (
      <div style={{
        position: 'absolute', top: '12%', right: '16%', width: 90, height: 90,
        borderRadius: '50%', background: '#e8ecf5',
        boxShadow: `0 0 60px 10px rgba(220,228,245,0.35), ${shadow}`,
      }} />
    )
  }
  return null
}

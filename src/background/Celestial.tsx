import { moonPhase } from '../lib/sun'
import type { Scene } from '../lib/weatherCodes'

interface Props { scene: Scene; now: Date; night?: boolean }

/**
 * A sun for clear-day and a phase-lit moon for clear-night. On any other scene
 * at night (cloudy/rain/thunder/fog/snow) we render only a soft, diffuse glow —
 * the moon "behind the clouds" — so a weathery night never goes pitch black.
 */
export function Celestial({ scene, now, night }: Props) {
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
        position: 'absolute', top: '12%', right: '16%', width: 96, height: 96,
        borderRadius: '50%', background: '#eef2fb',
        boxShadow: `0 0 90px 22px rgba(214,224,248,0.55), ${shadow}`,
      }} />
    )
  }
  // Overcast/rainy/foggy night: just a hazy moon glow diffusing through cloud.
  if (night) {
    return (
      <div style={{
        position: 'absolute', top: '8%', right: '12%', width: 260, height: 260,
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(206,219,248,0.30) 0%, transparent 68%)',
        filter: 'blur(8px)',
      }} />
    )
  }
  return null
}

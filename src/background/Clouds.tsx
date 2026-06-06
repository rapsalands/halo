import type { Scene } from '../lib/weatherCodes'

interface Props { scene: Scene }

/** How dense/visible the cloud layer is for each scene. 0 hides it entirely. */
const DENSITY: Record<Scene, number> = {
  'clear-day': 0.25,
  'clear-night': 0.18,
  cloudy: 0.9,
  fog: 1,
  rain: 0.8,
  thunder: 0.95,
  snow: 0.7,
}

interface Puff { top: string; size: number; dur: number; delay: number; opacity: number; blur: number }

const PUFFS: Puff[] = [
  { top: '8%', size: 360, dur: 90, delay: 0, opacity: 1, blur: 8 },
  { top: '22%', size: 520, dur: 130, delay: -30, opacity: 0.8, blur: 14 },
  { top: '4%', size: 280, dur: 70, delay: -50, opacity: 0.9, blur: 6 },
  { top: '38%', size: 600, dur: 160, delay: -90, opacity: 0.55, blur: 20 },
  { top: '15%', size: 440, dur: 110, delay: -120, opacity: 0.7, blur: 12 },
]

/** Soft drifting cloud bands. Visibility scales with the scene density. */
export function Clouds({ scene }: Props) {
  const density = DENSITY[scene]
  if (density <= 0) return null
  const tint = scene === 'clear-night' ? '210, 220, 245' : '255, 255, 255'
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: density, pointerEvents: 'none' }}>
      <style>{`
        @keyframes halo-cloud {
          from { transform: translateX(-30vw); }
          to   { transform: translateX(130vw); }
        }
      `}</style>
      {PUFFS.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: p.top, left: 0,
            width: p.size, height: p.size * 0.45, borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(${tint}, ${p.opacity}) 0%, rgba(${tint},0) 70%)`,
            filter: `blur(${p.blur}px)`,
            animation: `halo-cloud ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

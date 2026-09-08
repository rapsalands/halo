import { memo, useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { Scene } from '../lib/weatherCodes'
import type { Performance } from '../store/defaults'
import type { ParticleSystem } from './particles/types'
import { createRain } from './particles/rain'
import { createSnow } from './particles/snow'
import { createStars } from './particles/stars'

interface Props { scene: Scene; performance: Performance }

/** Which scenes actually draw particles. Kept beside `makeSystem` and in step
 *  with it, so the component can decide whether to mount a canvas at all. */
function hasParticles(scene: Scene): boolean {
  return scene === 'rain' || scene === 'thunder' || scene === 'snow' || scene === 'clear-night'
}

function makeSystem(scene: Scene, width: number, height: number, performance: Performance): ParticleSystem | null {
  const init = { width, height, performance }
  switch (scene) {
    case 'rain': return createRain(init)
    case 'thunder': return createRain({ ...init, intensity: 1.7 }) // heavier downpour
    case 'snow': return createSnow(init)
    case 'clear-night': return createStars(init)
    default: return null // clear-day, cloudy, fog have no canvas particles
  }
}

// Props are primitives (scene/performance), so memo lets the canvas skip the
// re-render when its parent re-renders for an unrelated reason.
export const ParticleCanvas = memo(function ParticleCanvas({ scene, performance }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()
  // Two reasons not to draw: the viewer asked for stillness, or this scene has
  // no particles. In the second case the canvas used to mount anyway — a
  // full-screen compositing layer that never drew anything.
  const active = hasParticles(scene) && !reduceMotion

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = (canvas.width = window.innerWidth)
    const height = (canvas.height = window.innerHeight)
    const system = makeSystem(scene, width, height, performance)
    if (!system) {
      ctx.clearRect(0, 0, width, height)
      return
    }
    let raf = 0
    let prev = Date.now()
    const targetMs = performance === 'low' ? 1000 / 30 : 1000 / 60 // throttle on Low
    const loop = () => {
      const t = Date.now()
      const dt = t - prev
      if (dt >= targetMs) {
        system.step(ctx, dt)
        prev = t
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [scene, performance, active])

  if (!active) return null

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
})

import { useEffect, useRef } from 'react'
import type { Scene } from '../lib/weatherCodes'
import type { Performance } from '../store/defaults'
import type { ParticleSystem } from './particles/types'
import { createRain } from './particles/rain'
import { createSnow } from './particles/snow'
import { createStars } from './particles/stars'

interface Props { scene: Scene; performance: Performance }

function makeSystem(scene: Scene, width: number, height: number, performance: Performance): ParticleSystem | null {
  const init = { width, height, performance }
  switch (scene) {
    case 'rain':
    case 'thunder': return createRain(init)
    case 'snow': return createSnow(init)
    case 'clear-night': return createStars(init)
    default: return null // clear-day, cloudy, fog have no canvas particles
  }
}

export function ParticleCanvas({ scene, performance }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
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
  }, [scene, performance])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

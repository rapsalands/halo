import type { Performance } from '../../store/defaults'

export interface ParticleInit {
  width: number
  height: number
  performance: Performance
  /** Multiplier on particle count/speed (e.g. heavier rain for thunderstorms). */
  intensity?: number
}

export interface ParticleSystem {
  count: number
  /** Advance and draw one frame. `dt` is milliseconds since the last frame. */
  step(ctx: CanvasRenderingContext2D, dt: number): void
}

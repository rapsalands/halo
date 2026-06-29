import { LOCAL_PHOTO_POOL } from '../background/photoManifest'

/** Offline build: never hotlink a remote photo CDN. */
const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'

export function photoUrl(seed: string | number, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

/**
 * Up to `count` photo urls for the rotating photo tile. Prefer bundled local
 * photos (offline, commercial-licensed); fall back to Picsum only online.
 */
export function photoSequence(count: number, w: number, h: number): string[] {
  if (LOCAL_PHOTO_POOL.length) {
    return Array.from({ length: count }, (_, i) => LOCAL_PHOTO_POOL[i % LOCAL_PHOTO_POOL.length])
  }
  if (OFFLINE) return []
  return Array.from({ length: count }, (_, i) => photoUrl(`halo-${i}`, w, h))
}

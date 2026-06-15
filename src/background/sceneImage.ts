import type { Scene } from '../lib/weatherCodes'

/** Build an Unsplash CDN url at a kiosk-friendly size. */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=72`

/**
 * Weather/time-appropriate backdrop per scene. The procedural sky is replaced
 * by these so clear vs night vs rain look genuinely different. Swap any id
 * here to change a scene's backdrop; all are verified to load.
 */
const IMAGES: Record<Scene, string> = {
  'clear-day': U('photo-1501854140801-50d01698950b'), // sunlit green hills
  'clear-night': U('photo-1419242902214-272b3f66ee7a'), // starry twilight forest
  cloudy: U('photo-1534088568595-a066f410bcda'), // overcast sky
  fog: U('photo-1487621167305-5d248087c724'), // foggy forest
  rain: U('photo-1428592953211-077101b2021b'), // rain on glass
  thunder: U('photo-1605727216801-e27ce1d0cc28'), // lightning storm
  snow: U('photo-1491002052546-bf38f186af56'), // snowy forest
}

export function sceneImage(scene: Scene): string {
  return IMAGES[scene]
}

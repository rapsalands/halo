import type { Scene } from '../lib/weatherCodes'

/** Build an Unsplash CDN url at a kiosk-friendly size. */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=72`

/**
 * Weather/time-appropriate backdrops per scene — a handful each so the
 * background can slowly cross-fade between them. Every id here is verified to
 * load; add or swap ids freely.
 */
const IMAGES: Record<Scene, string[]> = {
  'clear-day': [
    'photo-1501854140801-50d01698950b', // sunlit green hills
    'photo-1444703686981-a3abbc4d4fe3', // blue sky clouds
    'photo-1472214103451-9374bd1c798e', // green valley
    'photo-1501785888041-af3ef285b470', // lake & mountains
    'photo-1500964757637-c85e8a162699', // bright peak
  ],
  'clear-night': [
    'photo-1419242902214-272b3f66ee7a', // starry twilight forest
    'photo-1444080748397-f442aa95c3e5', // milky way
    'photo-1475274047050-1d0c0975c63e', // night sky
    'photo-1507400492013-162706c8c05e', // stars over hills
  ],
  cloudy: [
    'photo-1534088568595-a066f410bcda', // overcast sky
    'photo-1499956827185-0d63ee78a910', // grey clouds
    'photo-1495592822108-9e6261896da8', // moody clouds
    'photo-1500740516770-92bd004b996e', // soft overcast
  ],
  fog: [
    'photo-1487621167305-5d248087c724', // foggy forest
    'photo-1483982258113-b72862e6cff6', // misty hills
    'photo-1513002749550-c59d786b8e6c', // fog road
    'photo-1419833173245-f59e1b93f9ee', // foggy trees
  ],
  rain: [
    'photo-1428592953211-077101b2021b', // rain on glass
    'photo-1501691223387-dd0500403074', // wet street
    'photo-1438449805896-28a666819a20', // rainy window
    'photo-1493314894560-5c412a56c17c', // raindrops
  ],
  thunder: [
    'photo-1605727216801-e27ce1d0cc28', // lightning storm
    'photo-1429552077091-836152271555', // storm clouds
    'photo-1500674425229-f692875b0ab7', // dramatic storm field
  ],
  snow: [
    'photo-1491002052546-bf38f186af56', // snowy forest
    'photo-1483664852095-d6cc6870702d', // snow field
    'photo-1542601906990-b4d3fb778b09', // snowfall
    'photo-1517299321609-52687d1bc55a', // snowy trees
  ],
}

/** All backdrop urls for a scene (length ≥ 1). */
export function sceneImages(scene: Scene): string[] {
  return IMAGES[scene].map(U)
}

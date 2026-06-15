import { sceneFor, type Scene } from '../lib/weatherCodes'
import { timeOfDay, type DayPart } from '../lib/time'
import type { Weather } from '../store/appState'

export interface Palette {
  /** Two-stop sky gradient (top → bottom). */
  sky: [string, string]
  /** Aurora-glass accent tint that matches the scene/time. */
  accent: string
}

export interface SceneResult {
  scene: Scene
  dayPart: DayPart
  palette: Palette
}

const SKIES: Record<Scene, Record<DayPart, [string, string]>> = {
  'clear-day': {
    dawn: ['#ff9a76', '#ffd9a0'], day: ['#3a6390', '#7ba7cf'],
    dusk: ['#ff7e5f', '#feb47b'], night: ['#0d1c44', '#16306a'],
  },
  'clear-night': {
    dawn: ['#1a2a52', '#3a4a72'], day: ['#2a3a62', '#4a5a82'],
    dusk: ['#16203f', '#23305a'], night: ['#0b1437', '#1c356e'],
  },
  cloudy: {
    dawn: ['#8a93a8', '#c2c8d4'], day: ['#7d8aa0', '#aeb8c8'],
    dusk: ['#5a6276', '#8a8f9e'], night: ['#1d2740', '#35496e'],
  },
  fog: {
    dawn: ['#b9bcc2', '#dfe2e6'], day: ['#aeb2ba', '#d4d7dc'],
    dusk: ['#888d96', '#b4b8c0'], night: ['#414856', '#626a7c'],
  },
  rain: {
    dawn: ['#4a5568', '#6b7488'], day: ['#3f4a5c', '#5a6478'],
    dusk: ['#363f50', '#4c5566'], night: ['#141d31', '#28385c'],
  },
  thunder: {
    dawn: ['#2a2f3a', '#414857'], day: ['#2c313c', '#454c5b'],
    dusk: ['#23272f', '#363c47'], night: ['#10131f', '#242e46'],
  },
  snow: {
    dawn: ['#9aa6b8', '#d6dde7'], day: ['#8f9cb0', '#cdd6e2'],
    dusk: ['#6f7a8c', '#a6b0c0'], night: ['#28354c', '#47587c'],
  },
}

const ACCENTS: Record<DayPart, string> = {
  dawn: '#ffb37e', day: '#7fd0ff', dusk: '#ff9e6d', night: '#9db4ff',
}

export function selectScene(weather: Weather, now: Date): SceneResult {
  const sunrise = new Date(weather.sunriseToday)
  const sunset = new Date(weather.sunsetToday)
  const dayPart = timeOfDay(now, sunrise, sunset)
  const scene = sceneFor(weather.code, weather.isDay)
  const sky = SKIES[scene][dayPart]
  // Rain/thunder/snow override the accent toward a cool tone for cohesion.
  const accent = scene === 'rain' || scene === 'thunder'
    ? '#8fb4d8'
    : ACCENTS[dayPart]
  return { scene, dayPart, palette: { sky, accent } }
}

export interface ResolvedScene {
  sky: [string, string]
  scene: Scene
  accent: string
  night: boolean
}

/**
 * Resolve the full background context, including a sensible default before the
 * first weather load. Shared by BackgroundEngine and WeatherEffectsOverlay so
 * the sky and the effects always agree on the active scene.
 */
export function resolveScene(weather: Weather | null, now: Date): ResolvedScene {
  if (!weather) {
    return { sky: ['#1a2238', '#2a3658'], scene: 'cloudy', accent: '#7fd0ff', night: false }
  }
  const r = selectScene(weather, now)
  return { sky: r.palette.sky, scene: r.scene, accent: r.palette.accent, night: r.dayPart === 'night' }
}

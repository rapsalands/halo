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
    dawn: ['#ff9a76', '#ffd9a0'], day: ['#4a90e2', '#a7d3ff'],
    dusk: ['#ff7e5f', '#feb47b'], night: ['#0b1a3a', '#10254f'],
  },
  'clear-night': {
    dawn: ['#1a2a52', '#3a4a72'], day: ['#2a3a62', '#4a5a82'],
    dusk: ['#16203f', '#23305a'], night: ['#070b18', '#0e1630'],
  },
  cloudy: {
    dawn: ['#8a93a8', '#c2c8d4'], day: ['#7d8aa0', '#aeb8c8'],
    dusk: ['#5a6276', '#8a8f9e'], night: ['#1a1f2c', '#2a3140'],
  },
  fog: {
    dawn: ['#b9bcc2', '#dfe2e6'], day: ['#aeb2ba', '#d4d7dc'],
    dusk: ['#888d96', '#b4b8c0'], night: ['#3a3e46', '#565b64'],
  },
  rain: {
    dawn: ['#4a5568', '#6b7488'], day: ['#3f4a5c', '#5a6478'],
    dusk: ['#363f50', '#4c5566'], night: ['#10141d', '#1c2230'],
  },
  thunder: {
    dawn: ['#2a2f3a', '#414857'], day: ['#2c313c', '#454c5b'],
    dusk: ['#23272f', '#363c47'], night: ['#0a0c11', '#161a22'],
  },
  snow: {
    dawn: ['#9aa6b8', '#d6dde7'], day: ['#8f9cb0', '#cdd6e2'],
    dusk: ['#6f7a8c', '#a6b0c0'], night: ['#222a36', '#374252'],
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

import { create } from 'zustand'

export interface GeoLocation { lat: number; lon: number; name: string }

export interface DailyForecast {
  date: string
  code: number
  tempMax: number
  tempMin: number
  sunrise: string
  sunset: string
  uvMax: number
}

export interface Weather {
  code: number
  isDay: boolean
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  sunriseToday: string
  sunsetToday: string
  daily: DailyForecast[]
  stale: boolean
}

interface AppState {
  now: Date
  weather: Weather | null
  location: GeoLocation | null
  setNow: (d: Date) => void
  setWeather: (w: Weather) => void
  setLocation: (l: GeoLocation) => void
}

export const useAppState = create<AppState>((set) => ({
  now: new Date(),
  weather: null,
  location: null,
  setNow: (now) => set({ now }),
  setWeather: (weather) => set({ weather }),
  setLocation: (location) => set({ location }),
}))

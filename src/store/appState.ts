import { create } from 'zustand'

export interface GeoLocation { lat: number; lon: number; name: string; countryCode?: string }

export interface DailyForecast {
  date: string
  code: number
  tempMax: number
  tempMin: number
  sunrise: string
  sunset: string
  uvMax: number
}

export interface HourlyForecast {
  time: string
  temp: number
  code: number
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
  hourly: HourlyForecast[]
  stale: boolean
  /** IANA timezone for the location (from the weather feed's timezone=auto); the
   * clock renders in this zone so it matches the configured location, not the host. */
  timezone?: string
}

interface AppState {
  now: Date
  weather: Weather | null
  location: GeoLocation | null
  editMode: boolean
  setNow: (d: Date) => void
  setWeather: (w: Weather) => void
  setLocation: (l: GeoLocation) => void
  setEditMode: (v: boolean) => void
}

export const useAppState = create<AppState>((set) => ({
  now: new Date(),
  weather: null,
  location: null,
  editMode: false,
  setNow: (now) => set({ now }),
  setWeather: (weather) => set({ weather }),
  setLocation: (location) => set({ location }),
  setEditMode: (editMode) => set({ editMode }),
}))

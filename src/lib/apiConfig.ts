/**
 * Base URLs for the live weather feeds. These are *not* hardcoded to any public
 * provider — point them at your own self-hosted weather API that exposes the
 * `/v1/forecast` and `/v1/air-quality` paths, via env vars.
 *
 *   VITE_WEATHER_API_BASE=https://weather.your-host
 *   VITE_AIR_API_BASE=https://weather.your-host
 *
 * Default is same-origin (''), so a reverse proxy that exposes the API under
 * the kiosk's own origin works with no config. See .env.example.
 */
export const WEATHER_API_BASE: string = import.meta.env.VITE_WEATHER_API_BASE ?? ''
export const AIR_API_BASE: string = import.meta.env.VITE_AIR_API_BASE ?? ''

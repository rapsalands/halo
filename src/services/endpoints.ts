/** Base URLs for every external API the services talk to. Centralised here so
 * hosts are easy to find, swap, or route through a proxy — no URLs hardcoded in
 * the service modules themselves. */
export const API = {
  ipapi: 'https://ipapi.co',
  coingecko: 'https://api.coingecko.com/api/v3',
  wikipediaOnThisDay: 'https://en.wikipedia.org/api/rest_v1/feed/onthisday/events',
  picsum: 'https://picsum.photos',
  nager: 'https://date.nager.at/api/v3',
  openWeather: 'https://api.openweathermap.org',
  nws: 'https://api.weather.gov',
  airNow: 'https://www.airnowapi.org',
  cpcbResource: 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69',
} as const

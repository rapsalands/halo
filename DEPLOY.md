# Deploying Halo

Halo builds to static files (`dist/`) — host it anywhere and point the kiosk browser at the URL. No backend, no API keys.

## Build
```
npm install
npm run build      # outputs dist/
```
The Vite `base` is `./` (relative), so `dist/` works from any path or `file://`.

## Hosting options

### Netlify (drag-and-drop or Git)
`netlify.toml` is included. Connect the repo or drag `dist/` into Netlify. The SPA redirect keeps `?config=` URLs working.

### GitHub Pages
```
npm run build
npx gh-pages -d dist     # or push dist/ to the gh-pages branch
```

### Serve locally on the Pi
```
npm run build
npx serve dist -l 8080   # then open http://localhost:8080 in kiosk mode
```

## Kiosk launch (Raspberry Pi / KickPi)
Chromium full-screen kiosk:
```
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --check-for-update-interval=31536000 http://localhost:8080
```

## Per-screen configuration
- Open the ⚙ panel on the device to set location, units, tiles, layout, background mode, and performance.
- Settings persist in that device's `localStorage`.
- To clone a config between screens: open settings, copy the export blob, and on another screen either paste it into "Import" or append `?config=<blob>` to the URL.

## Performance on low-power devices
Set **Performance: Low** in the settings panel on a base Raspberry Pi — it caps particle counts and disables the glass blur. A KickPi or stronger device can run **High**.

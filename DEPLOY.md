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

### GitHub Pages (free, automatic — recommended)
A workflow at `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

One-time setup:
1. Create a repo and push `main`:
   ```
   gh repo create halo --public --source=. --remote=origin --push
   # (or: create the repo on github.com, then)
   git remote add origin https://github.com/<you>/halo.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the workflow manually). The site publishes at
   `https://<you>.github.io/halo/`.

`base: './'` in `vite.config.ts` keeps asset paths relative, so it works under the
`/halo/` subpath with no extra config. `?config=` and `?demo=` query params work too.

Manual alternative:
```
npm run build
npx gh-pages -d dist     # pushes dist/ to a gh-pages branch
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

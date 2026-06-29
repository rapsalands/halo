# Backdrop & tile photos (offline, commercial-safe)

The kiosk prefers **bundled local photos** and only falls back to a remote CDN
(Unsplash for backdrops, Picsum for the photo tile) in the **online** build.
The **offline** build (`VITE_OFFLINE=true`) never hotlinks a remote photo.

## Adding photos

1. Drop image files (`.jpg/.jpeg/.png/.webp/.avif`) into the scene folder:

   ```
   public/photos/
     clear-day/    clear-night/   cloudy/   fog/
     rain/         thunder/       snow/
   ```

   Backdrops look best at ~2400px wide. A few per scene lets the background
   cross-fade between them.

2. Regenerate the manifest:

   ```bash
   npm run build:photos
   ```

   This rewrites `src/background/photoManifest.ts` (auto-generated — don't edit
   by hand) with the files it finds. Commit both the images and the manifest.

The flat pool of all photos also feeds the rotating photo tile.

## Licensing — commercial use only

This is a **commercial** product, so every bundled image must permit commercial
use. Safe sources (no attribution legally required, but keep a record):

| Source | License | Notes |
|---|---|---|
| **Pexels** | Pexels License | Free for commercial, no attribution required |
| **Pixabay** | Pixabay Content License | Commercial OK, no attribution required |
| **Unsplash** (downloaded, not hotlinked) | Unsplash License | Commercial OK; download the file, don't hotlink the CDN in the offline build |
| **Wikimedia Commons** (CC0 / public domain) | CC0 | Commercial OK |
| Your own photos | — | You own the rights |

Avoid anything marked "editorial use only", "non-commercial", CC BY-**NC**, or
with model/property-release caveats. Keep a `CREDITS` note per source if you
want a record of provenance.

## Switching builds

- Online build (default): local photos first, remote fallback for empty scenes.
- Offline build: set `VITE_OFFLINE=true` at build time — only bundled photos are
  used; scenes with no local photo show the toned gradient instead.

# Halo on-device bundle (KioskOS product contract)

KioskOS treats Halo as a generic **content product** — it has no Halo-specific
code. Everything KioskOS needs is published *inside the release artifact*
(`halo-dist.tar.gz`), and KioskOS's generic installer reads it. Any other product
(e.g. a future "Toma") ships the same shape; swapping products changes no OS code.

## Artifact layout (`halo-dist.tar.gz`)

```
├── dist/                  # the built SPA (served read-only)
├── product.yaml           # self-description the OS reads (id, name, url, units to enable)
├── halo.service           # serve unit: python http.server on 127.0.0.1:8090
├── halo-update.sh         # self-updater (fetch latest bundle → atomic swap)
├── halo-update.service    # oneshot wrapper for the updater
└── halo-update.timer      # periodic + on-boot update check
```

The files in this `device/` dir are bundled into the artifact by
`.github/workflows/deploy.yml`.

## Contract with KioskOS

- The OS installs `dist/` to `/opt/content/<id>/dist` and the units to the
  system unit dir, then enables the units listed in `product.yaml: enable`.
- The OS sets the content surface's URL to `product.yaml: url` and probes it for
  readiness. It never references Halo by name.
- **Halo owns its updates.** `halo-update.timer` runs `halo-update.sh` as root;
  it fetches the rolling release, verifies it, and atomically swaps the served
  `dist`. Offline or unchanged → no-op. KioskOS OTA never ships or updates Halo.

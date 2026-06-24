#!/usr/bin/env bash
# Halo self-updater. Halo OWNS its updates — KioskOS never ships or updates Halo.
#
# Runs as root via halo-update.timer: when online, fetch the latest published
# bundle and swap the served dist in place. Offline or unchanged → no-op (exit 0
# so the timer never parks the unit in a failed state). The running browser picks
# up the new app-shell on its next reload (Halo reloads itself nightly).
set -euo pipefail

ARTIFACT_URL="${HALO_ARTIFACT_URL:-https://github.com/rapsalands/halo/releases/download/dist-latest/halo-dist.tar.gz}"
DEST="${HALO_DEST:-/opt/content/halo}"
STAMP="$DEST/.artifact.sha256"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Offline / transient failure is normal — don't fail the unit.
if ! curl -fSL -o "$tmp/a.tgz" "$ARTIFACT_URL"; then
    echo "halo-update: fetch failed (offline?) — skipping"
    exit 0
fi

new_sha="$(sha256sum "$tmp/a.tgz" | cut -d' ' -f1)"
if [ -f "$STAMP" ] && [ "$new_sha" = "$(cat "$STAMP")" ]; then
    echo "halo-update: already up to date"
    exit 0
fi

# Validate before swapping so a corrupt download never replaces a good dist.
tar xzf "$tmp/a.tgz" -C "$tmp" --no-same-owner
test -f "$tmp/dist/index.html"

# Swap in place (rename within the same fs is atomic; the gap between the two
# renames is sub-millisecond and the loaded page is unaffected).
rm -rf "$DEST/dist.old"
[ -d "$DEST/dist" ] && mv "$DEST/dist" "$DEST/dist.old"
mv "$tmp/dist" "$DEST/dist"
rm -rf "$DEST/dist.old"
echo "$new_sha" > "$STAMP"
echo "halo-update: updated dist to $new_sha"

# @janus/branding

Shared Janus brand assets for web, PWA, and the future Electron shell.

## Layout

- `source/janus-icon-1024.png` — canonical 1024x1024 PNG source (8-bit RGBA).
- `web/` — files served by `apps/web` as Vite's `publicDir`.
  - `icons/favicon.ico`, `icons/icon-192.png`, `icons/icon-512.png`, and related sizes.
  - `icons/site.webmanifest` — PWA manifest used by `/icons/site.webmanifest`.
- `electron/` — reserved for the future Electron app.
  - `icon.png`, `icon.ico`, and `icon.icns`.

## Web usage

`apps/web/vite.config.ts` points `publicDir` at `packages/branding/web`, so the
files are copied verbatim into the web build under the site root. The root route
declares the icon and manifest links in `apps/web/src/routes/__root.tsx`.

## Regenerating derived assets

From the repo root, resize the canonical source with `sips`:

```bash
sips -z 192 192 packages/branding/source/janus-icon-1024.png \
  --out packages/branding/web/icons/icon-192.png
sips -z 512 512 packages/branding/source/janus-icon-1024.png \
  --out packages/branding/web/icons/icon-512.png
```

Rebuild the macOS icon set with `iconutil` when the source changes:

```bash
rm -rf /tmp/Janus.iconset
mkdir -p /tmp/Janus.iconset
sips -z 1024 1024 packages/branding/source/janus-icon-1024.png \
  --out /tmp/Janus.iconset/icon_512x512@2x.png
iconutil --convert icns --output packages/branding/electron/icon.icns /tmp/Janus.iconset
```

The icon set should include `icon_16x16.png`, `icon_16x16@2x.png`,
`icon_32x32.png`, `icon_32x32@2x.png`, `icon_128x128.png`, `icon_128x128@2x.png`,
`icon_256x256.png`, `icon_256x256@2x.png`, `icon_512x512.png`, and
`icon_512x512@2x.png`.

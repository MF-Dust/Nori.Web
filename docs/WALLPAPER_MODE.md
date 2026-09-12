# Nori desktop wallpaper mode

Nori.Web exposes a dedicated presentation mode intended for desktop wallpaper hosts such as Lively Wallpaper or other tools that can render a web URL as a live background.

## Hosted / local URL

After starting Nori.Web, open:

```text
http://127.0.0.1:4173/wallpaper.html
```

`wallpaper.html` redirects to the normal application entry with `wallpaper=1`, so the same runtime, Live2D model and scene assets are reused without maintaining a second copy of the application shell.

The equivalent direct URL is:

```text
http://127.0.0.1:4173/?wallpaper=1
```

Wallpaper mode is URL-scoped. It does not persist the ordinary **Hide GUI** setting, so visiting the normal Nori.Web URL later still uses the user's regular interface preference.

## Interaction

The default wallpaper mode keeps the presentation non-interactive so retained scene layers do not capture pointer input inside generic wallpaper hosts.

For hosts that intentionally forward pointer input to the web wallpaper, use:

```text
http://127.0.0.1:4173/wallpaper.html?interactive=1
```

or:

```text
http://127.0.0.1:4173/?wallpaper=1&interactive=1
```

## Browser API

`window.NoriWallpaperMode` exposes a small read-only helper API:

```js
NoriWallpaperMode.active
NoriWallpaperMode.interactive
NoriWallpaperMode.url({ interactive: true })
NoriWallpaperMode.exit()
```

The existing `window.NoriUISettings` API remains responsible for the persistent browser **Hide GUI** preference.
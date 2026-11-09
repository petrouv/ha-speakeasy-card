# Contributing

## Development

The built `speakeasy-card.js` is committed together with the sources, because HACS serves it as is.

```
src/speakeasy-card.js   the card: UI, stream switching, microphone, stats
src/video-rtc-ext.js    our changes on top of VideoRTC (a subclass; upstream is not edited)
vendor/                 unmodified upstream copies, pinned in vendor/vendor.json
scripts/build.py        builds the bundle
scripts/vendor.py       updates files in vendor/
scripts/screenshots/    renders the README screenshots in images/
```

```bash
python3 scripts/build.py           # build the bundle
python3 scripts/build.py --check   # what CI runs: the bundle is up to date
```

The build concatenates the modules and strips `import` / `export`. Before that it checks that:

- `vendor/` files match their sha256 in the manifest, i.e. nobody edited them by hand;
- the upstream code the overrides in `src/video-rtc-ext.js` rely on is still there (`UPSTREAM_CONTRACT` in `build.py`). If this fails after an upstream update, review the matching override;
- the bundle passes `node --check`, when node is installed.

Updating a dependency:

```bash
python3 scripts/vendor.py update video-rtc.js <commit>
python3 scripts/build.py
```

Some of the changes in `src/video-rtc-ext.js` are proposed upstream in go2rtc: [#2665](https://github.com/AlexxIT/go2rtc/pull/2665), [#2666](https://github.com/AlexxIT/go2rtc/pull/2666), [#2667](https://github.com/AlexxIT/go2rtc/pull/2667), [#2668](https://github.com/AlexxIT/go2rtc/issues/2668), [#2669](https://github.com/AlexxIT/go2rtc/issues/2669). Once a change is merged and `vendor/video-rtc.js` is updated, the matching override is deleted.

## Screenshots

The README screenshots in `images/` are rendered from the built bundle, so after a UI change rebuild and re-shoot them:

```bash
pip install playwright && playwright install chromium   # once
python3 scripts/build.py
python3 scripts/screenshots/shoot.py                     # all scenes, or name some: camera-cat
```

`scripts/screenshots/stand.html` runs the real card in headless Chromium with stand-ins for the Home Assistant frontend: a fake `hass`, minimal `ha-card` / `ha-icon` elements, and a still frame from `frames/` in place of the stream. Each scene in `scenes.js` sets the card config, entity states, theme, frame and its crop to the card's aspect ratio. Icons come from `@mdi/js`; the script fails if an icon used in `src/` or `scenes.js` is missing there or the page logs an error.

## Adding a language

UI strings live in `STRINGS` in `src/speakeasy-card.js`, keyed by language code. Add one more entry with the same keys as `en`, then rebuild the bundle. The card picks the Home Assistant UI language and falls back to English.

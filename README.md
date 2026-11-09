# Speakeasy

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![GitHub release](https://img.shields.io/github/v/release/petrouv/ha-speakeasy-card)](https://github.com/petrouv/ha-speakeasy-card/releases)
[![Check](https://github.com/petrouv/ha-speakeasy-card/actions/workflows/check.yml/badge.svg)](https://github.com/petrouv/ha-speakeasy-card/actions/workflows/check.yml)

A doorbell, intercom and camera card for Home Assistant: live WebRTC video, push-to-talk microphone and stream quality switching. Built for video doorbells and intercoms with an audio backchannel (Aqara G4, Aqara G400, Reolink Doorbell and similar), but works with any camera served by go2rtc.

<p align="center">
  <img src="https://raw.githubusercontent.com/petrouv/ha-speakeasy-card/main/images/doorbell-goose.jpg" alt="Doorbell: a goose at the door, Doorbell and Motion badges, Talk button, HD/SD/LD switch and quick replies" width="300">
  &nbsp;
  <img src="https://raw.githubusercontent.com/petrouv/ha-speakeasy-card/main/images/camera-cat.jpg" alt="Indoor camera without a microphone, dark theme: a cat in IR mode, Pet badge, PTZ, presets and toggles" width="460">
</p>

## Features

- **Push-to-talk.** The microphone is not captured when the page opens. **Talk** attaches it to the already established connection without renegotiation, **Listen** detaches it. A conversation survives automatic reconnects. The microphone is released when the connection drops, you leave the page or switch streams. Failures (no HTTPS, permission denied, the camera does not accept audio) are shown as a notification that explains the cause.
- **Quality switching.** A segmented control over the `streams` list, any number of streams. Labels come from `name`, defaulting to `HD` / `SD` / `LD`. Hidden when only one stream is configured.
- **Control bar under the video.** Buttons never cover the picture. On a narrow card (phone, masonry column) the bar takes two rows, on a wide one a single row. Colours follow the Home Assistant theme. Controls: pause, sound, reconnect, snapshot, stats, picture-in-picture, fullscreen.
- **Stream stats.** Resolution, FPS, bitrate and RTT for WebRTC; mode and resolution for MSE/HLS.
- **No layout jumps.** `aspect_ratio` reserves the height up front. In the Sections view the card spans the full width and its height follows the content.
- **Digital zoom** (wheel, pinch, drag), plus optional PTZ buttons and service shortcuts.
- **Event badges over the video:** motion, person, doorbell — each shows only while its entity is active.
- **Localized UI:** English and Russian, following the language of the Home Assistant user profile.

## Requirements

- The **[WebRTC Camera](https://github.com/AlexxIT/WebRTC)** integration. The card connects to its `/api/webrtc/ws` endpoint, and the integration proxies the stream from the built-in or an external go2rtc. The go2rtc add-on or Home Assistant's built-in go2rtc alone are not enough. The `webrtc-camera` card itself is not used and does not conflict: this card registers its own element name.
- **HTTPS** (or `localhost`) for the microphone. Browsers require it for `getUserMedia`.
- For talking, the go2rtc stream must support an audio backchannel. Audio to the camera goes over WebRTC only, so the default mode is `webrtc`.
- A browser with CSS container queries: Chrome / Android WebView 105+, Safari / iOS 16+, Firefox 110+. The Home Assistant companion app on current iOS and Android qualifies.

## Installation

**HACS.**

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=petrouv&repository=ha-speakeasy-card&category=plugin)

The button opens the card in HACS, adding the repository first if needed. Install "Speakeasy — Doorbell, Intercom & Camera Card" and reload the page. Without the button: HACS → three dots → Custom repositories → `https://github.com/petrouv/ha-speakeasy-card`, type "Dashboard".

**Manual.** Copy `speakeasy-card.js` to `<config>/www/` and add a dashboard resource (Settings → Dashboards → Resources):

[![Open your Home Assistant instance and show your dashboard resources.](https://my.home-assistant.io/badges/lovelace_resources.svg)](https://my.home-assistant.io/redirect/lovelace_resources/)

```yaml
url: /local/speakeasy-card.js?v=0.1.0
type: module
```

Bump `?v=` after every update, otherwise browsers and the app keep the cached copy.

## Example

```yaml
type: custom:speakeasy-card
aspect_ratio: '3:4'
media: video,audio,microphone
streams:
  - url: intercom_hd
    name: HD
  - url: intercom_sd
    name: SD
  - url: intercom_ld
    name: LD
```

`url` is a go2rtc stream name. A Home Assistant camera `entity` can be used instead.

A PTZ camera (Tapo Control entities as an example). The camera controls, presets, toggles and the **Talk** button go into a panel that the last toolbar button opens and closes; the card remembers its state per browser:

```yaml
type: custom:speakeasy-card
entity: camera.kitchen_hd_stream
media: video,audio,microphone
talk: panel
tools: [volume, reconnect, screenshot, info, pip, fullscreen]
ptz:
  service: button.press
  position: bar
  data_left: {entity_id: button.kitchen_move_left}
  data_up: {entity_id: button.kitchen_move_up}
  data_down: {entity_id: button.kitchen_move_down}
  data_right: {entity_id: button.kitchen_move_right}
preset: select.kitchen_move_to_preset
toggles:
  - entity: switch.kitchen_privacy
    icon: mdi:eye-off-outline
  - entity: switch.kitchen_auto_track
    icon: mdi:target-account
  - entity: select.kitchen_night_vision_switching
    icon: mdi:weather-night
    name: {en: IR, de: IR}
    options:
      auto: {en: Auto, de: Auto}
      'on': {en: 'On', de: Ein}
      'off': {en: 'Off', de: Aus}
    on_states: ['on']
```

A doorbell with a privacy switch, quick replies (scripts that play a message) and event badges over the video:

```yaml
type: custom:speakeasy-card
url: doorbell_hd
media: video,audio,microphone
toggles:
  - entity: switch.doorbell_privacy
    icon: mdi:eye-off-outline
  - entity: script.doorbell_say_one_minute
    name: {en: One minute, de: Einen Moment}
    icon: mdi:timer-sand
indicators:
  - entity: event.doorbell_ring
    name: {en: Doorbell, de: Klingel}
    icon: mdi:bell-ring
    color: '#ff9800'
  - entity: binary_sensor.doorbell_motion
    icon: mdi:motion-sensor
```

Labels (`name`, `options`) take a plain string or a map by language code; the card picks the Home Assistant UI language, then `en`, then the first entry. Quote `'on'`, `'off'`, `'On'` and `'Off'`: YAML reads them as booleans otherwise.

## Options

| Option | Default | Description |
|---|---|---|
| `url` | — | go2rtc stream name or source URL (`rtsp://…`). One of `url`, `entity` or `streams` is required. |
| `entity` | — | Home Assistant camera as the stream source. |
| `streams` | — | Streams for the quality switch. Each item has `url` or `entity`, plus optional `name`, `mode`, `media`. The first stream opens on load. |
| `media` | `video,audio` | What to request: `video`, `audio`, `microphone`. Add `microphone` to get the **Talk** button. |
| `mode` | `webrtc` | Comma-separated technologies in order of preference: `webrtc`, `mse`, `hls`, `mjpeg`. Talking works only over `webrtc`. |
| `aspect_ratio` | `16:9` | Video proportions: `'16:9'`, `'3:4'`, `'1920x1080'` or a number (`1.5`). Quote the value: YAML reads unquoted `16:9` as the number 969; the card recognises common cases, but not all. |
| `muted` | `false` | Start muted. If the browser blocks autoplay with sound, the card falls back to muted playback by itself. |
| `ui` | `true` | Show the control bar. `false` leaves just the video and the stream technology badge (RTC, MSE…) over it; with the bar on, the badge shows only while loading or on error. |
| `title` | — | Text in the status line. |
| `poster` | — | Image shown before the video starts: a URL or path (`/local/…`), or a go2rtc stream name for a camera snapshot. |
| `intersection` | `0.75` | Share of the card that must be visible for the stream to start. `0` starts it always. |
| `background` | `false` | Keep streaming while the card is hidden or the tab is inactive. |
| `server` | — | External go2rtc address for the WebRTC Camera integration. |
| `digital_ptz` | enabled | Digital zoom. `false` disables it. Fine-tuning: `mouse_drag_pan`, `mouse_wheel_zoom`, `mouse_double_click_zoom`, `touch_pinch_zoom`, `touch_drag_pan`, `touch_tap_drag_zoom`, `persist`. |
| `tools` | all | Toolbar buttons to show, in fixed order: `play`, `volume`, `reconnect`, `screenshot`, `info`, `pip`, `fullscreen`. Buttons not listed are left out. |
| `talk` | `bar` | Where the **Talk** button lives (needs `microphone` in `media`): `bar` keeps it always visible in the toolbar, `panel` moves it into the camera panel, `false` hides it. |
| `ptz` | — | PTZ buttons: `service` (e.g. `onvif.ptz`), `data_left`, `data_right`, `data_up`, `data_down`, `data_zoom_in`, `data_zoom_out`, `data_home`, `opacity`, `position`. `position: bar` moves the buttons from the video into the camera panel (needs `ui`). |
| `preset` | — | A `select` entity (e.g. camera presets): a drop-down in the camera panel; choosing an item calls `select.select_option`. |
| `toggles` | — | Entities shown as labelled chips in the camera panel: an entity id, or `entity` + `icon` + `name`. A tap on a `switch` / `light` / `siren` calls `homeassistant.toggle`; a tinted chip means `on`. A `select` entity opens the system picker and calls `select.select_option`; optional `options` (value → label), `icons` (value → icon) and `on_states` (values shown tinted, default `[on]`). A `script` / `scene` is run (`turn_on`), a `button` / `input_button` is pressed: these action chips are filled, sit in their own row at the top of the panel (quick replies stay at hand), tint briefly on tap, and a script stays tinted while it runs. `name` and `options` labels can be maps by language code. |
| `indicators` | — | Badges in the top left corner of the video, each shown only while active: an entity id, or `entity` + `icon` + `name` + `color` (CSS colour, default red). A `binary_sensor` (or any entity) is active while `on`; an `event` entity, whose state is the time of its last event, for `hold` seconds after it (default `60`). |
| `shortcuts` | — | Icons over the video: `name`, `icon`, and either `service` + `service_data` or `more_info`. |
| `style` | — | Extra CSS inside the card. Rarely needed. |

`${...}` templates in options, supported by WebRTC Camera, are intentionally not supported here: they were evaluated with `eval`.

## Development

Building the bundle, the source layout and adding a language: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

- [go2rtc](https://github.com/AlexxIT/go2rtc) `video-rtc.js`, the WebRTC/MSE player — AlexxIT, MIT.
- [WebRTC Camera](https://github.com/AlexxIT/WebRTC), the basis of the card and `digital-ptz.js` — AlexxIT, MIT.
- [pan-zoom-controller](https://github.com/dbuezas/pan-zoom-controller), behind the digital zoom — dbuezas; `digital-ptz.js` is taken as distributed with WebRTC Camera.

MIT license, see [LICENSE](LICENSE). Third-party notices: [NOTICE](NOTICE).

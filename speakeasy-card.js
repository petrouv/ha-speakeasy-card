/**
 * Speakeasy — doorbell, intercom and camera card for Home Assistant
 * https://github.com/petrouv/ha-speakeasy-card
 *
 * WebRTC video with push-to-talk two-way audio,
 * HD/SD/LD stream switching, live stream stats and mobile-friendly controls.
 *
 * Includes code from:
 *   - go2rtc video-rtc.js by AlexxIT (MIT) - https://github.com/AlexxIT/go2rtc
 *   - WebRTC Camera by AlexxIT (MIT)       - https://github.com/AlexxIT/WebRTC
 *   - pan-zoom-controller by dbuezas, via WebRTC Camera - https://github.com/dbuezas/pan-zoom-controller
 *   See NOTICE for the copyright and license notices.
 *
 * GENERATED FILE - do not edit by hand. Edit src/ and run scripts/build.py.
 */

// === digital-ptz.js ===
// js version generated from https://github.com/dbuezas/pan-zoom-controller/blob/main/src/digital-ptz.ts
const ONE_FINGER_ZOOM_SPEED = 1 / 200; // 1 scale every 200px
const DBL_CLICK_MS = 400;
const MAX_ZOOM = 10;
const DEFAULT_OPTIONS = {
  touch_drag_pan: true,
  touch_tap_drag_zoom: true,
  mouse_drag_pan: true,
  mouse_wheel_zoom: true,
  mouse_double_click_zoom: true,
  touch_pinch_zoom: true,
  persist_key: "",
  persist: true,
};
class DigitalPTZ {
  constructor(containerEl, transformEl, videoEl, options) {
    this.offHandles = [];
    this.recomputeRects = () => {
      this.transform.updateRects(this.videoEl, this.containerEl);
      this.transform.zoomAtCoords(1, 0, 0); // clamp transform
      this.render();
    };
    this.render = (transition = false) => {
      if (transition) {
        // transition is used to animate dbl click zoom
        this.transformEl.style.transition = "transform 200ms";
        setTimeout(() => {
          this.transformEl.style.transition = "";
        }, 200);
      }
      this.transformEl.style.transform = this.transform.render();
    };
    this.containerEl = containerEl;
    this.transformEl = transformEl;
    this.videoEl = videoEl;
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.transform = new Transform({
      persist_key: this.options.persist_key,
      persist: this.options.persist,
    });
    const o = this.options;
    const gestureParam = {
      containerEl: this.containerEl,
      transform: this.transform,
      render: this.render,
    };
    const h = this.offHandles;
    if (o.mouse_drag_pan) h.push(startMouseDragPan(gestureParam));
    if (o.mouse_wheel_zoom) h.push(startMouseWheel(gestureParam));
    if (o.mouse_double_click_zoom) h.push(startDoubleClickZoom(gestureParam));
    if (o.touch_tap_drag_zoom) h.push(startTouchTapDragZoom(gestureParam));
    if (o.touch_drag_pan) h.push(startTouchDragPan(gestureParam));
    if (o.touch_pinch_zoom) h.push(startTouchPinchZoom(gestureParam));
    this.videoEl.addEventListener("loadedmetadata", this.recomputeRects);
    this.videoEl.addEventListener("loadeddata", this.recomputeRects);
    this.resizeObserver = new ResizeObserver(this.recomputeRects);
    this.resizeObserver.observe(this.containerEl);
    this.recomputeRects();
  }
  destroy() {
    for (const off of this.offHandles) off();
    this.videoEl.removeEventListener("loadedmetadata", this.recomputeRects);
    this.videoEl.removeEventListener("loadeddata", this.recomputeRects);
    this.resizeObserver.unobserve(this.containerEl);
  }
}
/* Gestures */
const preventScroll = (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
};
const getCenter = (touches) => ({
  x: (touches[0].pageX + touches[1].pageX) / 2,
  y: (touches[0].pageY + touches[1].pageY) / 2,
});
const getSpread = (touches) =>
  Math.hypot(
    touches[0].pageX - touches[1].pageX,
    touches[0].pageY - touches[1].pageY
  );
function startTouchPinchZoom({ containerEl, transform, render }) {
  const onTouchStart = (downEvent) => {
    const relevant = downEvent.touches.length === 2;
    if (!relevant) return;
    let lastTouches = downEvent.touches;
    const onTouchMove = (moveEvent) => {
      const newTouches = moveEvent.touches;
      const oldCenter = getCenter(lastTouches);
      const newCenter = getCenter(newTouches);
      const dx = newCenter.x - oldCenter.x;
      const dy = newCenter.y - oldCenter.y;
      transform.move(dx, dy);
      const oldSpread = getSpread(lastTouches);
      const newSpread = getSpread(newTouches);
      const zoom = newSpread / oldSpread;
      transform.zoomAtCoords(zoom, newCenter.x, newCenter.y);
      lastTouches = moveEvent.touches;
      render();
      preventScroll(moveEvent);
    };
    const onTouchEnd = () =>
      containerEl.removeEventListener("touchmove", onTouchMove);
    containerEl.addEventListener("touchmove", onTouchMove);
    containerEl.addEventListener("touchend", onTouchEnd, { once: true });
  };
  containerEl.addEventListener("touchstart", onTouchStart);
  return () => containerEl.removeEventListener("touchstart", onTouchStart);
}
const getDist = (t1, t2) =>
  Math.hypot(
    t1.touches[0].pageX - t2.touches[0].pageX,
    t1.touches[0].pageY - t2.touches[0].pageY
  );
function startTouchTapDragZoom({ containerEl, transform, render }) {
  let lastEvent;
  let fastClicks = 0;
  const onTouchStart = (downEvent) => {
    const isFastClick =
      lastEvent && downEvent.timeStamp - lastEvent.timeStamp < DBL_CLICK_MS;
    if (!isFastClick) fastClicks = 0;
    fastClicks++;
    if (downEvent.touches.length > 1) fastClicks = 0;
    lastEvent = downEvent;
  };
  const onTouchMove = (moveEvent) => {
    if (fastClicks === 2) {
      const lastY = lastEvent.touches[0].pageY;
      const currY = moveEvent.touches[0].pageY;
      transform.zoom(1 - (lastY - currY) * ONE_FINGER_ZOOM_SPEED);
      lastEvent = moveEvent;
      render();
      preventScroll(moveEvent);
    } else if (getDist(lastEvent, moveEvent) > 10) {
      fastClicks = 0;
    }
  };
  containerEl.addEventListener("touchmove", onTouchMove);
  containerEl.addEventListener("touchstart", onTouchStart);
  return () => {
    containerEl.removeEventListener("touchmove", onTouchMove);
    containerEl.removeEventListener("touchstart", onTouchStart);
  };
}
function startMouseWheel({ containerEl, transform, render }) {
  const onWheel = (e) => {
    const zoom = 1 - e.deltaY / 1000;
    transform.zoomAtCoords(zoom, e.pageX, e.pageY);
    render();
    preventScroll(e);
  };
  containerEl.addEventListener("wheel", onWheel);
  return () => containerEl.removeEventListener("wheel", onWheel);
}
function startDoubleClickZoom({ containerEl, transform, render }) {
  let lastDown = 0;
  let clicks = 0;
  const onDown = (downEvent) => {
    const isFastClick = downEvent.timeStamp - lastDown < DBL_CLICK_MS;
    lastDown = downEvent.timeStamp;
    if (!isFastClick) clicks = 0;
    clicks++;
    if (clicks !== 2) return;
    const onUp = (upEvent) => {
      const isQuickRelease = upEvent.timeStamp - lastDown < DBL_CLICK_MS;
      const dist = Math.hypot(
        upEvent.pageX - downEvent.pageX,
        upEvent.pageY - downEvent.pageY
      );
      if (!isQuickRelease || dist > 20) return;
      const zoom = transform.scale == 1 ? 2 : 0.01;
      transform.zoomAtCoords(zoom, upEvent.pageX, upEvent.pageY);
      render(true);
    };
    window.addEventListener("mouseup", onUp, { once: true });
  };
  containerEl.addEventListener("mousedown", onDown);
  return () => containerEl.removeEventListener("mousedown", onDown);
}
function startGesturePan({ containerEl, transform, render }, type) {
  const [downName, moveName, upName] =
    type === "mouse"
      ? ["mousedown", "mousemove", "mouseup"]
      : ["touchstart", "touchmove", "touchend"];
  const isTouchEvent = ev => 'TouchEvent' in window && ev instanceof TouchEvent;
  const onDown = (downEvt) => {
    let last = isTouchEvent(downEvt) ? downEvt.touches[0] : downEvt;
    const onMove = (moveEvt) => {
      if (isTouchEvent(moveEvt) && moveEvt.touches.length !== 1) return;
      const curr = isTouchEvent(moveEvt) ? moveEvt.touches[0] : moveEvt;
      transform.move(curr.pageX - last.pageX, curr.pageY - last.pageY);
      last = curr;
      render();
      if (transform.scale !== 1) preventScroll(moveEvt);
    };
    containerEl.addEventListener(moveName, onMove);
    const onUp = () => containerEl.removeEventListener(moveName, onMove);
    window.addEventListener(upName, onUp, { once: true });
  };
  containerEl.addEventListener(downName, onDown);
  return () => containerEl.removeEventListener(downName, onDown);
}
function startTouchDragPan(params) {
  return startGesturePan(params, "touch");
}
function startMouseDragPan(params) {
  return startGesturePan(params, "mouse");
}
/** Transform */
const PERSIST_KEY_PREFIX = "webrtc-digital-ptc:";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
function getTransformedDimensions(video) {
  const { videoWidth, videoHeight } = video;
  if (!videoHeight || !videoWidth) return undefined;
  var transform = window.getComputedStyle(video).getPropertyValue("transform");
  const match = transform.match(/matrix\((.+)\)/);
  if (!match || !match[1]) return { videoWidth, videoHeight }; // the video isn't transformed
  const matrix = new DOMMatrix(match[1].split(", ").map(Number));
  const points = [
    new DOMPoint(0, 0),
    new DOMPoint(videoWidth, 0),
    new DOMPoint(0, videoHeight),
    new DOMPoint(videoWidth, videoHeight),
  ].map((point) => point.matrixTransform(matrix));
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  return { videoWidth: maxX - minX, videoHeight: maxY - minY };
}
class Transform {
  constructor(settings) {
    this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.loadPersistedTransform = () => {
      const { persist_key, persist } = this.settings;
      if (!persist) return;
      try {
        const loaded = JSON.parse(localStorage[persist_key]);
        const isValid = [loaded.scale, loaded.x, loaded.y].every(
          Number.isFinite
        );
        if (!isValid) {
          throw new Error("Broken local storage");
        }
        this.x = loaded.x;
        this.y = loaded.y;
        this.scale = loaded.scale;
      } catch (e) {
        delete localStorage[persist_key];
      }
    };
    this.persistTransform = () => {
      const { persist_key, persist } = this.settings;
      if (!persist) return;
      const { x, y, scale } = this;
      localStorage[persist_key] = JSON.stringify({
        x,
        y,
        scale,
      });
    };
    this.settings = Object.assign(Object.assign({}, settings), {
      persist_key: PERSIST_KEY_PREFIX + settings.persist_key,
    });
    this.loadPersistedTransform();
  }
  updateRects(videoEl, containerEl) {
    const containerRect = containerEl.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
      // The container rect has no size yet.
      // This happens when coming back to a tab that was already opened.
      // The card will get size shortly and the size observer will call this function again.
      return;
    }
    this.containerRect = containerRect;
    const transformed = getTransformedDimensions(videoEl);
    if (!transformed) {
      // The video hasn't loaded yet.
      // Once it loads, the videometadata listener will call this function again.
      return;
    }
    // When in full screen, and if the aspect ratio of the screen differs from that of the video,
    // black bars will be shown either to the sides or above/below the video.
    // This needs to be accounted for when panning, the code below keeps track of that.
    const screenAspectRatio =
      this.containerRect.width / this.containerRect.height;
    const videoAspectRatio = transformed.videoWidth / transformed.videoHeight;
    if (videoAspectRatio > screenAspectRatio) {
      // Black bars on the top and bottom
      const videoHeight = this.containerRect.width / videoAspectRatio;
      const blackBarHeight = (this.containerRect.height - videoHeight) / 2;
      this.videoRect = new DOMRect(
        this.containerRect.x,
        blackBarHeight + this.containerRect.y,
        this.containerRect.width,
        videoHeight
      );
    } else {
      // Black bars on the sides
      const videoWidth = this.containerRect.height * videoAspectRatio;
      const blackBarWidth = (this.containerRect.width - videoWidth) / 2;
      this.videoRect = new DOMRect(
        blackBarWidth + this.containerRect.x,
        this.containerRect.y,
        videoWidth,
        this.containerRect.height
      );
    }
  }
  // dx,dy are deltas.
  move(dx, dy) {
    if (!this.videoRect) return;
    const bound = (this.scale - 1) / 2;
    this.x += dx / this.videoRect.width;
    this.y += dy / this.videoRect.height;
    this.x = clamp(this.x, -bound, bound);
    this.y = clamp(this.y, -bound, bound);
    this.persistTransform();
  }
  // x,y are relative to viewport (clientX, clientY)
  zoomAtCoords(zoom, x, y) {
    if (!this.containerRect || !this.videoRect) return;
    const oldScale = this.scale;
    this.scale *= zoom;
    this.scale = clamp(this.scale, 1, MAX_ZOOM);
    zoom = this.scale / oldScale;
    x = x - this.containerRect.x - this.containerRect.width / 2;
    y = y - this.containerRect.y - this.containerRect.height / 2;
    const dx = x - this.x * this.videoRect.width;
    const dy = y - this.y * this.videoRect.height;
    this.move(dx * (1 - zoom), dy * (1 - zoom));
  }
  zoom(zoom) {
    if (!this.containerRect || !this.videoRect) return;
    const x = this.containerRect.width / 2;
    const y = this.containerRect.height / 2;
    this.zoomAtCoords(zoom, x, y);
  }
  render() {
    if (!this.videoRect) return "";
    const { x, y, scale } = this;
    return `translate(${x * this.videoRect.width}px, ${
      y * this.videoRect.height
    }px) scale(${scale})`;
  }
}

// === video-rtc.js ===
/**
 * VideoRTC v1.6.0 - Video player for go2rtc streaming application.
 *
 * All modern web technologies are supported in almost any browser except Apple Safari.
 *
 * Support:
 * - ECMAScript 2017 (ES8) = ES6 + async
 * - RTCPeerConnection for Safari iOS 11.0+
 * - IntersectionObserver for Safari iOS 12.2+
 * - ManagedMediaSource for Safari 17+
 *
 * Doesn't support:
 * - MediaSource for Safari iOS
 * - Customized built-in elements (extends HTMLVideoElement) because Safari
 * - Autoplay for WebRTC in Safari
 */
class VideoRTC extends HTMLElement {
    constructor() {
        super();

        this.DISCONNECT_TIMEOUT = 5000;
        this.RECONNECT_TIMEOUT = 15000;

        this.CODECS = [
            'avc1.640029',      // H.264 high 4.1 (Chromecast 1st and 2nd Gen)
            'avc1.64002A',      // H.264 high 4.2 (Chromecast 3rd Gen)
            'avc1.640033',      // H.264 high 5.1 (Chromecast with Google TV)
            'hvc1.1.6.L153.B0', // H.265 main 5.1 (Chromecast Ultra)
            'mp4a.40.2',        // AAC LC
            'mp4a.40.5',        // AAC HE
            'flac',             // FLAC (PCM compatible)
            'opus',             // OPUS Chrome, Firefox
        ];

        /**
         * [config] Supported modes (webrtc, webrtc/tcp, mse, hls, mp4, mjpeg).
         * @type {string}
         */
        this.mode = 'webrtc,mse,hls,mjpeg';

        /**
         * [Config] Requested medias (video, audio, microphone).
         * @type {string}
         */
        this.media = 'video,audio';

        /**
         * [config] Run stream when not displayed on the screen. Default `false`.
         * @type {boolean}
         */
        this.background = false;

        /**
         * [config] Run stream only when player in the viewport. Stop when user scroll out player.
         * Value is percentage of visibility from `0` (not visible) to `1` (full visible).
         * Default `0` - disable;
         * @type {number}
         */
        this.visibilityThreshold = 0;

        /**
         * [config] Run stream only when browser page on the screen. Stop when user change browser
         * tab or minimise browser windows.
         * @type {boolean}
         */
        this.visibilityCheck = true;

        /**
         * [config] WebRTC configuration
         * @type {RTCConfiguration}
         */
        this.pcConfig = {
            bundlePolicy: 'max-bundle',
            iceServers: [{urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302']}],
            sdpSemantics: 'unified-plan',  // important for Chromecast 1
        };

        /**
         * [info] WebSocket connection state. Values: CONNECTING, OPEN, CLOSED
         * @type {number}
         */
        this.wsState = WebSocket.CLOSED;

        /**
         * [info] WebRTC connection state.
         * @type {number}
         */
        this.pcState = WebSocket.CLOSED;

        /**
         * @type {HTMLVideoElement}
         */
        this.video = null;

        /**
         * @type {WebSocket}
         */
        this.ws = null;

        /**
         * @type {string|URL}
         */
        this.wsURL = '';

        /**
         * @type {RTCPeerConnection}
         */
        this.pc = null;

        /**
         * @type {number}
         */
        this.connectTS = 0;

        /**
         * @type {string}
         */
        this.mseCodecs = '';

        /**
         * [internal] Disconnect TimeoutID.
         * @type {number}
         */
        this.disconnectTID = 0;

        /**
         * [internal] Reconnect TimeoutID.
         * @type {number}
         */
        this.reconnectTID = 0;

        /**
         * [internal] Handler for receiving Binary from WebSocket.
         * @type {Function}
         */
        this.ondata = null;

        /**
         * [internal] Handlers list for receiving JSON from WebSocket.
         * @type {Object.<string,Function>}
         */
        this.onmessage = null;
    }

    /**
     * Set video source (WebSocket URL). Support relative path.
     * @param {string|URL} value
     */
    set src(value) {
        if (typeof value !== 'string') value = value.toString();
        if (value.startsWith('http')) {
            value = 'ws' + value.substring(4);
        } else if (value.startsWith('/')) {
            value = 'ws' + location.origin.substring(4) + value;
        }

        this.wsURL = value;

        this.onconnect();
    }

    /**
     * Play video. Support automute when autoplay blocked.
     * https://developer.chrome.com/blog/autoplay/
     */
    play() {
        this.video.play().catch(() => {
            if (!this.video.muted) {
                this.video.muted = true;
                this.video.play().catch(er => {
                    console.warn(er);
                });
            }
        });
    }

    /**
     * Send message to server via WebSocket
     * @param {Object} value
     */
    send(value) {
        if (this.ws) this.ws.send(JSON.stringify(value));
    }

    /** @param {Function} isSupported */
    codecs(isSupported) {
        return this.CODECS
            .filter(codec => this.media.includes(codec.includes('vc1') ? 'video' : 'audio'))
            .filter(codec => isSupported(`video/mp4; codecs="${codec}"`)).join();
    }

    /**
     * `CustomElement`. Invoked each time the custom element is appended into a
     * document-connected element.
     */
    connectedCallback() {
        if (this.disconnectTID) {
            clearTimeout(this.disconnectTID);
            this.disconnectTID = 0;
        }

        // because video autopause on disconnected from DOM
        if (this.video) {
            const seek = this.video.seekable;
            if (seek.length > 0) {
                this.video.currentTime = seek.end(seek.length - 1);
            }
            this.play();
        } else {
            this.oninit();
        }

        this.onconnect();
    }

    /**
     * `CustomElement`. Invoked each time the custom element is disconnected from the
     * document's DOM.
     */
    disconnectedCallback() {
        if (this.background || this.disconnectTID) return;
        if (this.wsState === WebSocket.CLOSED && this.pcState === WebSocket.CLOSED) return;

        this.disconnectTID = setTimeout(() => {
            if (this.reconnectTID) {
                clearTimeout(this.reconnectTID);
                this.reconnectTID = 0;
            }

            this.disconnectTID = 0;

            this.ondisconnect();
        }, this.DISCONNECT_TIMEOUT);
    }

    /**
     * Creates child DOM elements. Called automatically once on `connectedCallback`.
     */
    oninit() {
        this.video = document.createElement('video');
        this.video.controls = true;
        this.video.playsInline = true;
        this.video.preload = 'auto';

        this.video.style.display = 'block'; // fix bottom margin 4px
        this.video.style.width = '100%';
        this.video.style.height = '100%';

        this.appendChild(this.video);

        this.video.addEventListener('error', ev => {
            const err = this.video.error;
            // https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
            const MEDIA_ERRORS = {
                1: 'MEDIA_ERR_ABORTED',
                2: 'MEDIA_ERR_NETWORK',
                3: 'MEDIA_ERR_DECODE',
                4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
            };
            console.error('[VideoRTC] Video error:', {
                error: err ? MEDIA_ERRORS[err.code] : 'unknown',
                message: err ? err.message : 'unknown',
                codecs: this.mseCodecs || 'not set',
                readyState: this.video.readyState,
                networkState: this.video.networkState,
                currentTime: this.video.currentTime
            });
            if (this.ws) this.ws.close(); // run reconnect for broken MSE stream
        });

        // all Safari lies about supported audio codecs
        const m = window.navigator.userAgent.match(/Version\/(\d+).+Safari/);
        if (m) {
            // AAC from v13, FLAC from v14, OPUS - unsupported
            const skip = m[1] < '13' ? 'mp4a.40.2' : m[1] < '14' ? 'flac' : 'opus';
            this.CODECS.splice(this.CODECS.indexOf(skip));
        }

        if (this.background) return;

        if ('hidden' in document && this.visibilityCheck) {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.disconnectedCallback();
                } else if (this.isConnected) {
                    this.connectedCallback();
                }
            });
        }

        if ('IntersectionObserver' in window && this.visibilityThreshold) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        this.disconnectedCallback();
                    } else if (this.isConnected) {
                        this.connectedCallback();
                    }
                });
            }, {threshold: this.visibilityThreshold});
            observer.observe(this);
        }
    }

    /**
     * Connect to WebSocket. Called automatically on `connectedCallback`.
     * @return {boolean} true if the connection has started.
     */
    onconnect() {
        if (!this.isConnected || !this.wsURL || this.ws || this.pc) return false;

        // CLOSED or CONNECTING => CONNECTING
        this.wsState = WebSocket.CONNECTING;

        this.connectTS = Date.now();

        this.ws = new WebSocket(this.wsURL);
        this.ws.binaryType = 'arraybuffer';
        this.ws.addEventListener('open', () => this.onopen());
        this.ws.addEventListener('close', () => this.onclose());

        return true;
    }

    ondisconnect() {
        this.wsState = WebSocket.CLOSED;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.pcState = WebSocket.CLOSED;
        if (this.pc) {
            this.pc.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop();
            });
            this.pc.close();
            this.pc = null;
        }

        this.video.src = '';
        this.video.srcObject = null;
    }

    /**
     * @returns {Array.<string>} of modes (mse, webrtc, etc.)
     */
    onopen() {
        // CONNECTING => OPEN
        this.wsState = WebSocket.OPEN;

        this.ws.addEventListener('message', ev => {
            if (typeof ev.data === 'string') {
                const msg = JSON.parse(ev.data);
                for (const mode in this.onmessage) {
                    this.onmessage[mode](msg);
                }
            } else {
                this.ondata(ev.data);
            }
        });

        this.ondata = null;
        this.onmessage = {};

        const modes = [];

        if (this.mode.includes('mse') && ('MediaSource' in window || 'ManagedMediaSource' in window)) {
            modes.push('mse');
            this.onmse();
        } else if (this.mode.includes('hls') && this.video.canPlayType('application/vnd.apple.mpegurl')) {
            modes.push('hls');
            this.onhls();
        } else if (this.mode.includes('mp4')) {
            modes.push('mp4');
            this.onmp4();
        }

        if (this.mode.includes('webrtc') && 'RTCPeerConnection' in window) {
            modes.push('webrtc');
            this.onwebrtc();
        }

        if (this.mode.includes('mjpeg')) {
            if (modes.length) {
                this.onmessage['mjpeg'] = msg => {
                    if (msg.type !== 'error' || msg.value.indexOf(modes[0]) !== 0) return;
                    this.onmjpeg();
                };
            } else {
                modes.push('mjpeg');
                this.onmjpeg();
            }
        }

        return modes;
    }

    /**
     * @return {boolean} true if reconnection has started.
     */
    onclose() {
        if (this.wsState === WebSocket.CLOSED) return false;

        // CONNECTING, OPEN => CONNECTING
        this.wsState = WebSocket.CONNECTING;
        this.ws = null;

        // reconnect no more than once every X seconds
        const delay = Math.max(this.RECONNECT_TIMEOUT - (Date.now() - this.connectTS), 0);

        this.reconnectTID = setTimeout(() => {
            this.reconnectTID = 0;
            this.onconnect();
        }, delay);

        return true;
    }

    onmse() {
        /** @type {MediaSource} */
        let ms;

        if ('ManagedMediaSource' in window) {
            const MediaSource = window.ManagedMediaSource;

            ms = new MediaSource();
            ms.addEventListener('sourceopen', () => {
                this.send({type: 'mse', value: this.codecs(MediaSource.isTypeSupported)});
            }, {once: true});

            this.video.disableRemotePlayback = true;
            this.video.srcObject = ms;
        } else {
            ms = new MediaSource();
            ms.addEventListener('sourceopen', () => {
                URL.revokeObjectURL(this.video.src);
                this.send({type: 'mse', value: this.codecs(MediaSource.isTypeSupported)});
            }, {once: true});

            this.video.src = URL.createObjectURL(ms);
            this.video.srcObject = null;
        }

        this.play();

        this.mseCodecs = '';

        this.onmessage['mse'] = msg => {
            if (msg.type !== 'mse') return;

            this.mseCodecs = msg.value;

            const sb = ms.addSourceBuffer(msg.value);
            sb.mode = 'segments'; // segments or sequence
            sb.addEventListener('updateend', () => {
                if (!sb.updating && bufLen > 0) {
                    try {
                        const data = buf.slice(0, bufLen);
                        sb.appendBuffer(data);
                        bufLen = 0;
                    } catch (e) {
                        // console.debug(e);
                    }
                }

                if (!sb.updating && sb.buffered && sb.buffered.length) {
                    const end = sb.buffered.end(sb.buffered.length - 1);
                    const start = end - 5;
                    const start0 = sb.buffered.start(0);
                    if (start > start0) {
                        sb.remove(start0, start);
                        ms.setLiveSeekableRange(start, end);
                    }
                    if (this.video.currentTime < start) {
                        this.video.currentTime = start;
                    }
                    const gap = end - this.video.currentTime;
                    this.video.playbackRate = gap > 0.1 ? gap : 0.1;
                    // console.debug('VideoRTC.buffered', gap, this.video.playbackRate, this.video.readyState);
                }
            });

            const buf = new Uint8Array(2 * 1024 * 1024);
            let bufLen = 0;

            this.ondata = data => {
                if (sb.updating || bufLen > 0) {
                    const b = new Uint8Array(data);
                    buf.set(b, bufLen);
                    bufLen += b.byteLength;
                    // console.debug('VideoRTC.buffer', b.byteLength, bufLen);
                } else {
                    try {
                        sb.appendBuffer(data);
                    } catch (e) {
                        // console.debug(e);
                    }
                }
            };
        };
    }

    onwebrtc() {
        const pc = new RTCPeerConnection(this.pcConfig);

        pc.addEventListener('icecandidate', ev => {
            if (ev.candidate && this.mode.includes('webrtc/tcp') && ev.candidate.protocol === 'udp') return;

            const candidate = ev.candidate ? ev.candidate.toJSON().candidate : '';
            this.send({type: 'webrtc/candidate', value: candidate});
        });

        pc.addEventListener('connectionstatechange', () => {
            if (pc.connectionState === 'connected') {
                const tracks = pc.getTransceivers()
                    .filter(tr => tr.currentDirection === 'recvonly') // skip inactive
                    .map(tr => tr.receiver.track);
                /** @type {HTMLVideoElement} */
                const video2 = document.createElement('video');
                video2.addEventListener('loadeddata', () => this.onpcvideo(video2), {once: true});
                video2.srcObject = new MediaStream(tracks);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                pc.close(); // stop next events

                this.pcState = WebSocket.CLOSED;
                this.pc = null;

                this.onconnect();
            }
        });

        this.onmessage['webrtc'] = msg => {
            switch (msg.type) {
                case 'webrtc/candidate':
                    if (this.mode.includes('webrtc/tcp') && msg.value.includes(' udp ')) return;

                    pc.addIceCandidate({candidate: msg.value, sdpMid: '0'}).catch(er => {
                        console.warn(er);
                    });
                    break;
                case 'webrtc/answer':
                    pc.setRemoteDescription({type: 'answer', sdp: msg.value}).catch(er => {
                        console.warn(er);
                    });
                    break;
                case 'error':
                    if (!msg.value.includes('webrtc/offer')) return;
                    pc.close();
            }
        };

        this.createOffer(pc).then(offer => {
            this.send({type: 'webrtc/offer', value: offer.sdp});
        });

        this.pcState = WebSocket.CONNECTING;
        this.pc = pc;
    }

    /**
     * @param pc {RTCPeerConnection}
     * @return {Promise<RTCSessionDescriptionInit>}
     */
    async createOffer(pc) {
        try {
            if (this.media.includes('microphone')) {
                const media = await navigator.mediaDevices.getUserMedia({audio: true});
                media.getTracks().forEach(track => {
                    pc.addTransceiver(track, {direction: 'sendonly'});
                });
            }
        } catch (e) {
            console.warn(e);
        }

        for (const kind of ['video', 'audio']) {
            if (this.media.includes(kind)) {
                pc.addTransceiver(kind, {direction: 'recvonly'});
            }
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        return offer;
    }

    /**
     * @param video2 {HTMLVideoElement}
     */
    onpcvideo(video2) {
        if (this.pc) {
            // Video+Audio > Video, H265 > H264, Video > Audio, WebRTC > MSE
            let rtcPriority = 0, msePriority = 0;

            /** @type {MediaStream} */
            const stream = video2.srcObject;
            if (stream.getVideoTracks().length > 0) {
                // not the best, but a pretty simple way to check a codec
                const isH265Supported =  this.pc.remoteDescription.sdp.includes('H265/90000');
                rtcPriority += isH265Supported ? 0x240 : 0x220;
            }
            if (stream.getAudioTracks().length > 0) rtcPriority += 0x102;

            if (this.mseCodecs.includes('hvc1.')) msePriority += 0x230;
            if (this.mseCodecs.includes('avc1.')) msePriority += 0x210;
            if (this.mseCodecs.includes('mp4a.')) msePriority += 0x101;

            if (rtcPriority >= msePriority) {
                this.video.srcObject = stream;
                this.play();

                this.pcState = WebSocket.OPEN;

                this.wsState = WebSocket.CLOSED;
                if (this.ws) {
                    this.ws.close();
                    this.ws = null;
                }
            } else {
                this.pcState = WebSocket.CLOSED;
                if (this.pc) {
                    this.pc.close();
                    this.pc = null;
                }
            }
        }

        video2.srcObject = null;
    }

    onmjpeg() {
        this.ondata = data => {
            this.video.controls = false;
            this.video.poster = 'data:image/jpeg;base64,' + VideoRTC.btoa(data);
        };

        this.send({type: 'mjpeg'});
    }

    onhls() {
        this.onmessage['hls'] = msg => {
            if (msg.type !== 'hls') return;

            const url = 'http' + this.wsURL.substring(2, this.wsURL.indexOf('/ws')) + '/hls/';
            const playlist = msg.value.replace('hls/', url);
            this.video.src = 'data:application/vnd.apple.mpegurl;base64,' + btoa(playlist);
            this.play();
        };

        this.send({type: 'hls', value: this.codecs(type => this.video.canPlayType(type))});
    }

    onmp4() {
        /** @type {HTMLCanvasElement} **/
        const canvas = document.createElement('canvas');
        /** @type {CanvasRenderingContext2D} */
        let context;

        /** @type {HTMLVideoElement} */
        const video2 = document.createElement('video');
        video2.autoplay = true;
        video2.playsInline = true;
        video2.muted = true;

        video2.addEventListener('loadeddata', () => {
            if (!context) {
                canvas.width = video2.videoWidth;
                canvas.height = video2.videoHeight;
                context = canvas.getContext('2d');
            }

            context.drawImage(video2, 0, 0, canvas.width, canvas.height);

            this.video.controls = false;
            this.video.poster = canvas.toDataURL('image/jpeg');
        });

        this.ondata = data => {
            video2.src = 'data:video/mp4;base64,' + VideoRTC.btoa(data);
        };

        this.send({type: 'mp4', value: this.codecs(this.video.canPlayType)});
    }

    static btoa(buffer) {
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        let binary = '';
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

// === video-rtc-ext.js ===
/**
 * VideoRTCExt - our additions on top of the unmodified upstream VideoRTC
 * (vendor/video-rtc.js, go2rtc, MIT). Nothing here edits the upstream file.
 *
 * - Push-to-talk microphone: the offer carries a sendonly audio transceiver
 *   without a track; the card attaches one on demand (micSender/micTrack),
 *   the live track survives automatic reconnects. Proposed upstream: go2rtc#2668.
 * - Lifecycle: the visibilitychange listener is removed when the element leaves
 *   the DOM (go2rtc#2667), plus onsuspend/onresume hooks (go2rtc#2669).
 * - Autoplay: mute only on NotAllowedError (go2rtc#2665).
 * - Microphone is released whenever the peer connection is dropped (go2rtc#2666).
 *
 * When an upstream PR is merged and the vendored copy is updated, delete the
 * matching override here. scripts/build.py checks that the upstream code these
 * overrides rely on is still there (UPSTREAM_CONTRACT).
 */

class VideoRTCExt extends VideoRTC {
    constructor() {
        super();

        /**
         * [internal] Sender of the sendonly audio transceiver of the current pc.
         * @type {RTCRtpSender}
         */
        this.micSender = null;

        /**
         * [internal] Live microphone track while talking.
         * @type {MediaStreamTrack}
         */
        this.micTrack = null;
        /** @type {MediaStream} */
        this.micStream = null;

        /**
         * [internal] Our visibilitychange handler; upstream's own is suppressed in oninit().
         * @type {Function}
         */
        this.visibilityHandler = null;
    }

    /**
     * Upstream mutes on any play() rejection; only NotAllowedError means autoplay
     * with sound is blocked (AbortError / NotSupportedError happen on source changes).
     */
    play() {
        this.video.play().catch(er => {
            if (er && er.name === 'NotAllowedError' && !this.video.muted) {
                this.video.muted = true;
                this.video.play().catch(er2 => {
                    console.warn(er2);
                });
            } else if (!er || er.name !== 'AbortError') {
                console.debug(er);
            }
        });
    }

    connectedCallback() {
        const reattached = !!this.video;
        super.connectedCallback();
        if (reattached) {
            this.bindObservers();
            this.onresume();
        }
    }

    /**
     * Replaces upstream: always schedule the timer (so an element removed while
     * already stopped is cleaned up), disconnect only an active connection,
     * and suspend only when the element really left the DOM.
     */
    disconnectedCallback() {
        if (this.background || this.disconnectTID) return;

        this.disconnectTID = setTimeout(() => {
            this.disconnectTID = 0;

            if (this.wsState !== WebSocket.CLOSED || this.pcState !== WebSocket.CLOSED) {
                this.ondisconnect();
            }

            if (!this.isConnected) {
                this.unbindObservers();
                this.onsuspend();
            }
        }, this.DISCONNECT_TIMEOUT);
    }

    oninit() {
        // upstream adds an anonymous, never-removed visibilitychange listener
        // when visibilityCheck is on; suppress it and install a removable one
        const visibilityCheck = this.visibilityCheck;
        this.visibilityCheck = false;
        super.oninit();
        this.visibilityCheck = visibilityCheck;
        this.bindObservers();
    }

    ondisconnect() {
        // stream switch / manual reconnect call ondisconnect() directly:
        // a pending automatic reconnect must not fire afterwards
        if (this.reconnectTID) {
            clearTimeout(this.reconnectTID);
            this.reconnectTID = 0;
        }

        this.stopMicrophone();
        this.micSender = null;
        super.ondisconnect();
    }

    /**
     * Replaces upstream: a sendonly audio transceiver without a track instead of
     * getUserMedia() on every connect; a live track is re-attached on reconnect.
     * @param pc {RTCPeerConnection}
     * @return {Promise<RTCSessionDescriptionInit>}
     */
    async createOffer(pc) {
        try {
            if (this.media.includes('microphone')) {
                const tr = pc.addTransceiver('audio', {direction: 'sendonly'});
                this.micSender = tr.sender;
                if (this.micTrack) {
                    if (this.micTrack.readyState === 'live') {
                        await tr.sender.replaceTrack(this.micTrack);
                    } else {
                        this.stopMicrophone();
                    }
                }
            } else if (this.micTrack) {
                this.stopMicrophone();
            }
        } catch (e) {
            console.warn(e);
        }

        for (const kind of ['video', 'audio']) {
            if (this.media.includes(kind)) {
                pc.addTransceiver(kind, {direction: 'recvonly'});
            }
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        return offer;
    }

    /**
     * Upstream closes the pc when MSE wins over WebRTC without releasing the microphone.
     * @param video2 {HTMLVideoElement}
     */
    onpcvideo(video2) {
        const pc = this.pc;
        super.onpcvideo(video2);
        if (pc && !this.pc) {
            this.stopMicrophone();
            this.micSender = null;
        }
    }

    /**
     * Called when the element left the DOM (after DISCONNECT_TIMEOUT), not on a hidden tab.
     */
    onsuspend() {
    }

    /**
     * Called when an initialised element is attached to the DOM again.
     */
    onresume() {
    }

    /**
     * Called whenever the microphone starts or stops, including on disconnect.
     * @param {boolean} active
     */
    onmicchange(active) {
    }

    /**
     * Stop talking: end the track and detach it from the sender. Idempotent.
     */
    stopMicrophone() {
        const track = this.micTrack;
        const stream = this.micStream;
        this.micTrack = null;
        this.micStream = null;

        if (track) {
            try { track.stop(); } catch (e) {}
        }
        if (stream) {
            try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        }
        if (this.micSender && this.pc && this.pc.signalingState !== 'closed') {
            this.micSender.replaceTrack(null).catch(() => {});
        }

        this.onmicchange(false);
    }

    /**
     * Pause the stream while the page is hidden. Idempotent.
     */
    bindObservers() {
        if (this.background || this.visibilityHandler) return;
        if (!('hidden' in document) || !this.visibilityCheck) return;

        this.visibilityHandler = () => {
            if (document.hidden) {
                this.disconnectedCallback();
            } else if (this.isConnected) {
                this.connectedCallback();
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    unbindObservers() {
        if (!this.visibilityHandler) return;
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        this.visibilityHandler = null;
    }
}

// === speakeasy-card.js ===
/**
 * Speakeasy - doorbell, intercom and camera card for Home Assistant.
 *
 * Based on WebRTC Camera by AlexxIT (https://github.com/AlexxIT/WebRTC, MIT).
 * Layout needs CSS container queries: Chrome 105+, Safari 16+, Firefox 110+.
 */

const VERSION = '0.1.0';

/**
 * UI strings. English is the fallback; the language follows the Home Assistant
 * user profile (hass.locale.language), then the browser.
 */
const STRINGS = {
    en: {
        talk: 'Talk',
        listen: 'Listen',
        connecting: 'Connecting…',
        quality: 'Quality',
        play: 'Pause / Play',
        volume: 'Sound',
        actionFailed: 'Action failed',
        reconnect: 'Reload stream',
        screenshot: 'Snapshot',
        info: 'Stream info',
        pip: 'Picture-in-picture',
        fullscreen: 'Fullscreen',
        statsHint: 'Stream stats (tap to hide)',
        noData: 'No data',
        micNoHttps: 'Microphone unavailable: browsers allow microphone access only over HTTPS.',
        micUnsupported: 'Microphone unavailable: the browser does not support getUserMedia or it is blocked by settings.',
        micNotConnected: 'The WebRTC stream is not connected yet. Wait for the video (RTC mode) and try again.',
        micNoChannel: 'This session has no audio channel for the microphone. Add `microphone` to the `media` option.',
        micNoBackchannel: 'The server does not accept microphone audio: the camera or go2rtc has no audio backchannel for this stream.',
        micNoTrack: 'The captured stream has no audio track',
        micReconnected: 'The connection was re-established, please try again',
        micDenied: 'Microphone access denied. Allow the microphone for Home Assistant in the browser or companion app settings.',
        micNotFound: 'No microphone found on this device.',
        micFailed: 'Failed to start the microphone: ',
        preset: 'Preset',
        noPresets: 'No presets',
        cameraControls: 'Camera controls',
        ptz_left: 'Left',
        ptz_up: 'Up',
        ptz_down: 'Down',
        ptz_right: 'Right',
        ptz_zoom_in: 'Zoom in',
        ptz_zoom_out: 'Zoom out',
        ptz_home: 'Home',
    },
    ru: {
        talk: 'Говорить',
        listen: 'Слушать',
        connecting: 'Подключение…',
        quality: 'Качество',
        play: 'Пауза / Воспроизведение',
        volume: 'Звук',
        actionFailed: 'Не удалось выполнить',
        reconnect: 'Перезагрузить поток',
        screenshot: 'Снимок',
        info: 'Информация о потоке',
        pip: 'Картинка в картинке',
        fullscreen: 'Полный экран',
        statsHint: 'Статистика потока (нажмите, чтобы скрыть)',
        noData: 'Нет данных',
        micNoHttps: 'Микрофон недоступен: браузер разрешает доступ к микрофону только по HTTPS.',
        micUnsupported: 'Микрофон недоступен: браузер не поддерживает getUserMedia или он заблокирован настройками.',
        micNotConnected: 'Поток WebRTC ещё не подключён. Дождитесь появления видео (режим RTC) и повторите.',
        micNoChannel: 'В текущей сессии нет аудиоканала для микрофона. Добавьте `microphone` в параметр `media`.',
        micNoBackchannel: 'Сервер не принимает звук с микрофона: камера или go2rtc не поддерживают обратный аудиоканал для этого потока.',
        micNoTrack: 'В полученном потоке нет аудиодорожки',
        micReconnected: 'Соединение было переподключено, попробуйте ещё раз',
        micDenied: 'Доступ к микрофону запрещён. Разрешите микрофон для Home Assistant в настройках браузера или мобильного приложения.',
        micNotFound: 'Микрофон не найден на этом устройстве.',
        micFailed: 'Ошибка включения микрофона: ',
        preset: 'Пресет',
        noPresets: 'Нет пресетов',
        cameraControls: 'Управление камерой',
        ptz_left: 'Влево',
        ptz_up: 'Вверх',
        ptz_down: 'Вниз',
        ptz_right: 'Вправо',
        ptz_zoom_in: 'Приблизить',
        ptz_zoom_out: 'Отдалить',
        ptz_home: 'Домой',
    },
};

/** Default quality labels for streams without an explicit `name`. */
const DEFAULT_STREAM_LABELS = ['HD', 'SD', 'LD'];

/** Default card mode: an intercom needs talkback, and talkback works only over WebRTC. */
const DEFAULT_MODE = 'webrtc';

/** Default video aspect ratio as a CSS `aspect-ratio` value. */
const DEFAULT_ASPECT_RATIO = '16 / 9';

/**
 * YAML 1.1 parses unquoted `16:9` as a base-60 number (16 * 60 + 9 = 969),
 * so map the common ones back to their ratios.
 */
const SEXAGESIMAL_RATIOS = {969: '16 / 9', 184: '3 / 4', 243: '4 / 3', 61: '1 / 1'};

/**
 * Convert `aspect_ratio` config values ('16:9', '16/9', '1920x1080', 1.5)
 * into a CSS `aspect-ratio` value. Anything unparsable falls back to the default.
 * @param {string|number} value
 * @return {string}
 */
const parseAspectRatio = value => {
    if (value === undefined || value === null || value === '') return DEFAULT_ASPECT_RATIO;
    if (typeof value === 'number') {
        if (SEXAGESIMAL_RATIOS[value]) return SEXAGESIMAL_RATIOS[value];
        return value > 0 ? String(value) : DEFAULT_ASPECT_RATIO;
    }
    const parts = String(value).trim().toLowerCase().split(/\s*[:/x]\s*/);
    const nums = parts.map(Number);
    if (nums.some(n => !(n > 0))) return DEFAULT_ASPECT_RATIO;
    if (nums.length === 1) return String(nums[0]);
    if (nums.length === 2) return `${nums[0]} / ${nums[1]}`;
    return DEFAULT_ASPECT_RATIO;
};

/** Tools of the control bar, in display order. `tools` selects a subset. */
/** Entities a chip runs instead of toggling: domain -> [service domain, service]. */
const ACTION_SERVICES = {
    script: ['script', 'turn_on'],
    button: ['button', 'press'],
    input_button: ['input_button', 'press'],
    scene: ['scene', 'turn_on'],
};

const ALL_TOOLS = ['play', 'volume', 'reconnect', 'screenshot', 'info', 'pip', 'fullscreen'];

/** PTZ buttons of the camera bar, in display order: [config path, icon]. */
const PTZ_BAR_BUTTONS = [
    ['left', 'mdi:chevron-left'],
    ['up', 'mdi:chevron-up'],
    ['down', 'mdi:chevron-down'],
    ['right', 'mdi:chevron-right'],
    ['zoom_out', 'mdi:minus'],
    ['zoom_in', 'mdi:plus'],
    ['home', 'mdi:home-outline'],
];

/** Escape a value for insertion into an HTML attribute / text node. */
const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));

class SpeakeasyCard extends VideoRTCExt {
    constructor() {
        super();

        /** [internal] true while `auth/sign_path` is in flight. */
        this._connecting = false;
        /** [internal] incremented on every connect/disconnect to drop stale callWS results. */
        this._connectSeq = 0;
        /** [internal] true while getUserMedia / replaceTrack is in flight. */
        this._micPending = false;
        /** [internal] stats overlay timer id. */
        this._statsInterval = 0;
        /** @type {DigitalPTZ} */
        this._digitalPTZ = null;
    }

    /**
     * Step 1. Called by the Hass, when config changed.
     * @param {Object} config
     */
    setConfig(config) {
        if (!config.url && !config.entity && !config.streams) {
            throw new Error('Missing `url` or `entity` or `streams`');
        }
        if (config.streams !== undefined) {
            if (!Array.isArray(config.streams) || config.streams.length === 0) {
                throw new Error('`streams` must be a non-empty list');
            }
            config.streams.forEach((stream, i) => {
                if (!stream || (!stream.url && !stream.entity)) {
                    throw new Error(`streams[${i}]: missing \`url\` or \`entity\``);
                }
            });
        }

        if (config.toggles !== undefined) {
            if (!Array.isArray(config.toggles)) throw new Error('`toggles` must be a list');
            config.toggles.forEach((item, i) => {
                if (!item || (typeof item !== 'string' && !item.entity)) {
                    throw new Error(`toggles[${i}]: missing \`entity\``);
                }
            });
        }
        if (config.indicators !== undefined) {
            if (!Array.isArray(config.indicators)) throw new Error('`indicators` must be a list');
            config.indicators.forEach((item, i) => {
                if (!item || (typeof item !== 'string' && !item.entity)) {
                    throw new Error(`indicators[${i}]: missing \`entity\``);
                }
            });
        }
        if (config.tools !== undefined && !Array.isArray(config.tools)) {
            throw new Error('`tools` must be a list');
        }
        if (config.talk !== undefined && !['bar', 'panel', false].includes(config.talk)) {
            throw new Error('`talk` must be `bar`, `panel` or `false`');
        }
        if (config.preset !== undefined && typeof config.preset !== 'string') {
            throw new Error('`preset` must be a select entity id');
        }

        if (config.background) this.background = config.background;

        if (config.intersection === 0) this.visibilityThreshold = 0;
        else this.visibilityThreshold = config.intersection || 0.75;

        /**
         * @type {{
         *     url: string,
         *     entity: string,
         *     mode: string,
         *     media: string,
         *
         *     streams: Array<{
         *         name: string,
         *         url: string,
         *         entity: string,
         *         mode: string,
         *         media: string,
         *     }>,
         *
         *     aspect_ratio: string|number,
         *     title: string,
         *     poster: string,
         *     poster_remote: boolean,
         *     muted: boolean,
         *     intersection: number,
         *     ui: boolean,
         *     style: string,
         *     background: boolean,
         *
         *     server: string,
         *
         *     digital_ptz:{
         *         mouse_drag_pan: boolean,
         *         mouse_wheel_zoom: boolean,
         *         mouse_double_click_zoom: boolean,
         *         touch_pinch_zoom: boolean,
         *         touch_drag_pan: boolean,
         *         touch_tap_drag_zoom: boolean,
         *         persist: boolean|string,
         *     },
         *     ptz:{
         *         opacity: number|string,
         *         position: 'overlay'|'bar',
         *         service: string,
         *         data_left, data_up, data_right, data_down, data_zoom_in, data_zoom_out, data_home
         *     },
         *     preset: string,
         *     toggles: Array<string|{
         *         entity:string, icon:string, name:string,
         *         options:Object<string,string>, icons:Object<string,string>, on_states:string[],
         *     }>,
         *     shortcuts:Array<{ name:string, icon:string, more_info:string, service:string, service_data:Object }>,
         * }} config
         */
        this.aspectRatio = parseAspectRatio(config.aspect_ratio);
        this.style.setProperty('--aic-aspect-ratio', this.aspectRatio);

        this.config = Object.assign({
            mode: DEFAULT_MODE,
            media: this.media,
            streams: [{url: config.url, entity: config.entity}],
            poster_remote: config.poster && (config.poster.indexOf('://') > 0 || config.poster.charAt(0) === '/'),
            ui: config.ui !== false,
        }, config);

        this.streamID = -1;
        this.nextStream(false);
    }

    set hass(hass) {
        const lang = this.lang;
        this._hass = hass;
        if (this.lang !== lang) this.applyLabels();
        this.updateCameraBar();
        this.updateIndicators();
    }

    /** UI language code with a STRINGS entry, 'en' otherwise. */
    get lang() {
        const hass = this._hass;
        const code = (hass && ((hass.locale && hass.locale.language) || hass.language)) || navigator.language || 'en';
        const lang = String(code).toLowerCase().split('-')[0];
        return STRINGS[lang] ? lang : 'en';
    }

    /**
     * Localized UI string.
     * @param {string} key
     * @return {string}
     */
    t(key) {
        return STRINGS[this.lang][key] || STRINGS.en[key];
    }

    /**
     * A config text that may be localized: a string, or {en: '…', ru: '…'}.
     * @param {string|Object<string,string>} value
     * @return {string}
     */
    loc(value) {
        if (!value || typeof value !== 'object') return value === undefined || value === null ? '' : String(value);
        return value[this.lang] || value.en || Object.values(value)[0] || '';
    }

    /** Where the talk button lives: 'bar', 'panel' or false (no microphone in `media` hides it anyway). */
    get talkPlace() {
        return this.config.talk === undefined ? 'bar' : this.config.talk;
    }

    /** Apply the current language to the static controls rendered in renderGUI(). */
    applyLabels() {
        if (!this.shadowRoot) return;
        // only querySelector is redirected to the shadow root (see renderMain)
        this.shadowRoot.querySelectorAll('[data-i18n]').forEach(el => {
            const text = this.t(el.dataset.i18n);
            el.title = text;
            el.setAttribute('aria-label', text);
        });
        const talk = this.querySelector('.talk');
        if (talk) {
            this.setTalkState(talk.classList.contains('active') ? 'active'
                : talk.classList.contains('pending') ? 'pending' : 'idle');
        }
    }

    get hass() {
        return this._hass;
    }

    /**
     * Called by the Hass Sections view: full width, height follows the content.
     */
    getGridOptions() {
        return {
            columns: 12,
            rows: 'auto',
            min_columns: 1,
            min_rows: 1,
        };
    }

    /**
     * Called by the Hass masonry view to estimate card height (x 50px).
     */
    getCardSize() {
        const [w, h] = (this.aspectRatio || DEFAULT_ASPECT_RATIO).split('/').map(parseFloat);
        // the control bar sits under the video: one row on wide cards, two on narrow ones
        const bar = this.config && this.config.ui ? 2 + (this.hasCameraBar ? 1 : 0) : 0;
        if (w > 0 && h > 0) return Math.round(10 * h / w) + bar;
        if (w > 0) return Math.round(10 / w) + bar;
        return 6 + bar;
    }

    /**
     * Called by the Hass to get default card config
     * @return {{url: string}}
     */
    static getStubConfig() {
        // a placeholder that passes setConfig(): the card picker inserts it as a YAML skeleton
        return {url: 'intercom', media: 'video,audio,microphone'};
    }

    setStatus(mode, status) {
        const modeEl = this.querySelector('.mode');
        if (!modeEl) return;
        const divMode = modeEl.innerText;
        if (mode === 'error' && divMode !== 'Loading..' && divMode !== 'Loading...') return;

        modeEl.innerText = mode;
        // with the toolbar on, the technology badge (RTC, MSE...) is noise: info / reconnect cover it
        modeEl.classList.toggle('tech', !!mode && mode !== 'error' && mode.indexOf('Loading') < 0);
        if (status && typeof status === 'object') status = status.message || status.code || String(status);
        this.querySelector('.status').innerText = status || '';
    }

    /**
     * Show a non-blocking message to the user (HA toast), with a console fallback.
     * @param {string} message
     */
    notify(message) {
        console.warn('speakeasy-card:', message);
        this.dispatchEvent(new CustomEvent('hass-notification', {
            detail: {message},
            bubbles: true,
            composed: true,
        }));
    }

    /**
     * @param {number} [index] stream index, defaults to the current one
     * @return {string} label shown on the quality badge
     */
    streamLabel(index) {
        if (index === undefined) index = this.streamID;
        const stream = this.config.streams[index];
        return (stream && stream.name) || DEFAULT_STREAM_LABELS[index] || `S${index + 1}`;
    }

    /** @param reload {boolean} */
    nextStream(reload) {
        this.streamID = (this.streamID + 1) % this.config.streams.length;

        const stream = this.config.streams[this.streamID];
        this.config.url = stream.url;
        this.config.entity = stream.entity;
        this.media = stream.media || this.config.media;
        this.mode = stream.mode || this.config.mode;

        this.updateStreamSwitcher();
        this.updateTalkButton();

        if (reload) {
            const statsEl = this.querySelector('.stats-overlay');
            if (statsEl) statsEl.innerText = `${this.streamLabel()} ${this.t('connecting')}`;
            this.reconnect();
        }
    }

    /** @param index {number} stream index to switch to */
    selectStream(index) {
        if (index === this.streamID || !this.config.streams[index]) return;
        this.streamID = index - 1;
        this.nextStream(true);
    }

    /**
     * Tear the current connection down and connect again (same stream).
     */
    reconnect() {
        const iconEl = this.querySelector('.reconnect ha-icon');
        if (iconEl) {
            iconEl.style.transform = 'rotate(360deg)';
            iconEl.style.transition = 'transform 0.4s ease';
            setTimeout(() => {
                iconEl.style.transform = '';
                iconEl.style.transition = '';
            }, 400);
        }

        this.ondisconnect();
        setTimeout(() => {
            if (this.isConnected) this.onconnect();
        }, 150);
    }

    oninit() {
        super.oninit();
        this.renderMain();
        this.renderDigitalPTZ();
        this.renderPTZ();
        this.renderCustomUI();
        this.renderCameraBar();
        this.renderIndicators();
        this.renderShortcuts();
        this.renderStyle();
    }

    onsuspend() {
        super.onsuspend();
        this.stopStats();
    }

    onresume() {
        super.onresume();
        this.startStats();
    }

    onconnect() {
        if (!this.config || !this.hass) return false;
        if (!this.isConnected || this.ws || this.pc || this._connecting) return false;

        this._connecting = true;
        const seq = ++this._connectSeq;

        this.setStatus('Loading..');

        this.hass.callWS({
            type: 'auth/sign_path', path: '/api/webrtc/ws'
        }).then(data => {
            if (seq !== this._connectSeq) return; // superseded by a reconnect / disconnect
            this._connecting = false;

            if (this.config.poster && !this.config.poster_remote) {
                this.video.poster = this.hass.hassUrl(data.path) + '&poster=' + encodeURIComponent(this.config.poster);
            }

            this.wsURL = 'ws' + this.hass.hassUrl(data.path).substring(4);

            if (this.config.entity) {
                this.wsURL += '&entity=' + encodeURIComponent(this.config.entity);
            } else if (this.config.url) {
                this.wsURL += '&url=' + encodeURIComponent(this.config.url);
            } else {
                this.setStatus('IMG');
                return;
            }

            if (this.config.server) {
                this.wsURL += '&server=' + encodeURIComponent(this.config.server);
            }

            if (super.onconnect()) {
                this.setStatus('Loading...');
            } else {
                this.setStatus('error', 'unable to connect');
            }
        }).catch(er => {
            if (seq !== this._connectSeq) return;
            this._connecting = false;
            this.setStatus('error', er);
        });

        return true;
    }

    ondisconnect() {
        this._connectSeq++;
        this._connecting = false;
        super.ondisconnect();
    }

    onopen() {
        const result = super.onopen();

        this.onmessage['stream'] = msg => {
            switch (msg.type) {
                case 'error':
                    this.setStatus('error', msg.value);
                    break;
                case 'mse':
                case 'hls':
                case 'mp4':
                case 'mjpeg':
                    this.setStatus(msg.type.toUpperCase(), this.config.title || '');
                    break;
            }
        };

        return result;
    }

    onpcvideo(ev) {
        super.onpcvideo(ev);

        if (this.pcState !== WebSocket.CLOSED) {
            this.setStatus('RTC', this.config.title || '');
        }
    }

    renderMain() {
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
        <style>
            ha-card {
                width: 100%;
                height: 100%;
                margin: auto;
                overflow: hidden;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            ha-icon {
                color: white;
                cursor: pointer;
            }
            [hidden] {
                display: none !important;
            }
            .player {
                background-color: black;
                width: 100%;
                flex: none;
                aspect-ratio: var(--aic-aspect-ratio, 16 / 9); /* reserve height before the video loads */
                position: relative; /* important for Safari */
                overflow: hidden;
            }
            .player:active {
                cursor: move; /* important for zoom-controller */
            }
            .player .ptz-transform {
                width: 100%;
                height: 100%;
            }
            .header {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 8px;
                pointer-events: none;
            }
            .status, .mode {
                color: rgba(255, 255, 255, 0.92);
                background: rgba(28, 28, 30, 0.45);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 0.5px solid rgba(255, 255, 255, 0.16);
                border-radius: 999px;
                padding: 3px 9px;
                font: 600 11px/16px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
                letter-spacing: 0.2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                min-width: 0;
            }
            .indicators {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                min-width: 0;
            }
            .indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 3px 10px 3px 7px;
                border-radius: 999px;
                color: #fff;
                background: color-mix(in srgb, var(--aic-indicator, #db4437) 82%, transparent);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                font: 600 11px/16px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
                letter-spacing: 0.2px;
                white-space: nowrap;
                animation: aic-badge-in 0.25s ease-out;
            }
            .indicator ha-icon {
                --mdc-icon-size: 14px;
                color: inherit;
                cursor: default;
            }
            @keyframes aic-badge-in {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: none; }
            }
            @media (prefers-reduced-motion: reduce) {
                .indicator { animation: none; }
            }
            .status:empty, .mode:empty, .ui-on .mode.tech {
                display: none;
            }
            .mode {
                margin-left: auto;
                cursor: pointer;
                pointer-events: auto;
            }
            video {
                width: 100% !important;
                height: 100% !important;
                aspect-ratio: var(--aic-aspect-ratio, 16 / 9);
                display: block;
                object-fit: contain;
                background: black;
            }
            :host(:fullscreen) ha-card, :fullscreen ha-card {
                border-radius: 0;
                background: black;
            }
            :host(:fullscreen) .player, :fullscreen .player {
                flex: 1 1 auto;
                height: auto;
                min-height: 0;
                aspect-ratio: unset;
            }
            :host(:fullscreen) video, :fullscreen video {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                aspect-ratio: unset !important;
                border-radius: 0 !important;
                background: black !important;
            }
        </style>
        <ha-card class="card">
            <div class="player">
                <div class="ptz-transform"></div>
            </div>
            <div class="header">
                <div class="status"></div>
                <div class="mode"></div>
            </div>
        </ha-card>
        `;

        this.querySelector = selectors => this.shadowRoot.querySelector(selectors);
        this.querySelector('.ptz-transform').appendChild(this.video);

        const mode = this.querySelector('.mode');
        mode.addEventListener('click', () => {
            if (this.config.streams.length > 1) this.nextStream(true);
            else this.reconnect();
        });

        if (this.config.muted) this.video.muted = true;
        if (this.config.poster_remote) this.video.poster = this.config.poster;
    }

    renderDigitalPTZ() {
        if (this.config.digital_ptz === false) return;
        this._digitalPTZ = new DigitalPTZ(
            this.querySelector('.player'),
            this.querySelector('.player .ptz-transform'),
            this.video,
            Object.assign({}, this.config.digital_ptz, {persist_key: this.config.url})
        );
    }

    /** PTZ buttons go to the camera bar under the video instead of floating over it. */
    get ptzInBar() {
        return !!(this.config.ui && this.config.ptz && this.config.ptz.service && this.config.ptz.position === 'bar');
    }

    get hasCameraBar() {
        return this.ptzInBar || !!this.config.preset || !!(this.config.toggles && this.config.toggles.length)
            || this.talkPlace === 'panel';
    }

    /**
     * Call the PTZ service with the `data_<path>` payload, if configured.
     * @param {string} path e.g. 'left', 'start_left', 'long_left'
     */
    ptzCall(path) {
        const data = this.config.ptz['data_' + path];
        if (!data || !this.hass) return;
        const [domain, service] = this.config.ptz.service.split('.', 2);
        this.hass.callService(domain, service, data);
    }

    renderPTZ() {
        if (!this.config.ptz || !this.config.ptz.service || this.ptzInBar) return;

        let hasMove = false;
        let hasZoom = false;
        let hasHome = false;
        for (const prefix of ['', '_start', '_end', '_long']) {
            hasMove = hasMove || this.config.ptz['data' + prefix + '_right'];
            hasMove = hasMove || this.config.ptz['data' + prefix + '_left'];
            hasMove = hasMove || this.config.ptz['data' + prefix + '_up'];
            hasMove = hasMove || this.config.ptz['data' + prefix + '_down'];

            hasZoom = hasZoom || this.config.ptz['data' + prefix + '_zoom_in'];
            hasZoom = hasZoom || this.config.ptz['data' + prefix + '_zoom_out'];

            hasHome = hasHome || this.config.ptz['data' + prefix + '_home'];
        }

        const card = this.querySelector('.card');
        card.insertAdjacentHTML('beforebegin', `
            <style>
                .ptz {
                    position: absolute;
                    top: 50%;
                    right: 10px;
                    transform: translateY(-50%);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 2;
                    transition: opacity .3s ease-in-out;
                    opacity: ${parseFloat(this.config.ptz.opacity) || 0.4};
                }
                .ptz:hover {
                    opacity: 1 !important;
                }
                .ptz-move {
                    position: relative;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    display: ${hasMove ? 'block' : 'none'};
                }
                .ptz-zoom {
                    position: relative;
                    width: 80px;
                    height: 40px;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                    display: ${hasZoom ? 'block' : 'none'};
                }
                .ptz-home {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                    align-self: center;
                    display: ${hasHome ? 'block' : 'none'};
                }
                .up {
                    position: absolute;
                    top: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .down {
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .left {
                    position: absolute;
                    left: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .right {
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .zoom_out {
                    position: absolute;
                    left: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .zoom_in {
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .home {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
            </style>
        `);
        // inside .player so the buttons stay centred on the video, not on video + control bar
        this.querySelector('.player').insertAdjacentHTML('beforeend', `
            <div class="ptz">
                <div class="ptz-move">
                    <ha-icon class="right" icon="mdi:arrow-right"></ha-icon>
                    <ha-icon class="left" icon="mdi:arrow-left"></ha-icon>
                    <ha-icon class="up" icon="mdi:arrow-up"></ha-icon>
                    <ha-icon class="down" icon="mdi:arrow-down"></ha-icon>
                </div>
                <div class="ptz-zoom">
                    <ha-icon class="zoom_in" icon="mdi:plus"></ha-icon>
                    <ha-icon class="zoom_out" icon="mdi:minus"></ha-icon>
                </div>
                <div class="ptz-home">
                    <ha-icon class="home" icon="mdi:home"></ha-icon>
                </div>
            </div>
        `);

        const handle = path => this.ptzCall(path);
        const ptz = this.querySelector('.ptz');
        for (const [start, end] of [['touchstart', 'touchend'], ['mousedown', 'mouseup']]) {
            ptz.addEventListener(start, startEvt => {
                const {className} = startEvt.target;
                startEvt.preventDefault();
                startEvt.stopPropagation(); // do not start a digital PTZ pan on .player
                handle('start_' + className);
                window.addEventListener(end, endEvt => {
                    endEvt.preventDefault();
                    handle('end_' + className);
                    if (endEvt.timeStamp - startEvt.timeStamp > 400) {
                        handle('long_' + className);
                    } else {
                        handle(className);
                    }
                }, {once: true});
            });
        }
    }

    /**
     * Camera panel under the toolbar, opened by its button: talk (`talk: panel`), PTZ pad, presets,
     * and labelled toggles. Needs `ui` (it reuses the bar's styles and theme variables).
     */
    renderCameraBar() {
        if (!this.config.ui || !this.hasCameraBar) return;

        const ptz = this.config.ptz || {};
        const has = path => ['', 'start_', 'end_', 'long_'].some(prefix => ptz['data_' + prefix + path]);
        const pad = this.ptzInBar ? PTZ_BAR_BUTTONS.filter(([path]) => has(path)) : [];
        this._toggles = (this.config.toggles || []).map(item => typeof item === 'string' ? {entity: item} : item);

        this.querySelector('.card').insertAdjacentHTML('beforebegin', `
            <style>
                .panel {
                    display: grid;
                    grid-template-rows: 0fr;
                    transition: grid-template-rows 0.25s var(--aic-ease);
                }
                .panel.open {
                    grid-template-rows: 1fr;
                }
                .panel-inner {
                    overflow: hidden;
                    min-height: 0;
                }
                .panel-body {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 4px 12px 12px;
                    color: var(--aic-fg);
                }
                .panel-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                /* reset with zero specificity, so the component rules below win */
                :where(.panel) button, :where(.panel) select {
                    appearance: none;
                    -webkit-appearance: none;
                    border: 0;
                    margin: 0;
                    font: inherit;
                    color: inherit;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                .panel button:focus-visible, .panel select:focus-visible, .chip:has(select:focus-visible) {
                    outline: 2px solid var(--aic-accent);
                    outline-offset: 2px;
                }
                .panel ha-icon {
                    color: inherit;
                    --mdc-icon-size: 20px;
                    pointer-events: none;
                    flex: none;
                }
                /* HA control buttons: 42px, radius 12px, neutral tint at 20% */
                .ctl {
                    height: var(--aic-ctl-h);
                    min-width: var(--aic-ctl-h);
                    padding: 0;
                    border-radius: var(--aic-ctl-r);
                    background: var(--aic-fill);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: none;
                    transition: background 0.18s ease-in-out, transform 0.12s ease-in-out;
                    touch-action: manipulation;
                }
                .ctl:hover {
                    background: var(--aic-fill-hover);
                }
                .ctl:active {
                    transform: scale(0.94);
                }
                .pad {
                    display: flex;
                    gap: 8px;
                    flex: none;
                }
                .panel .talk {
                    height: var(--aic-ctl-h);
                    border-radius: var(--aic-ctl-r);
                }
                .preset {
                    position: relative;
                    flex: 1 1 auto;
                    min-width: 120px;
                }
                .preset select {
                    width: 100%;
                    height: var(--aic-ctl-h);
                    padding: 0 36px 0 42px;
                    border-radius: var(--aic-ctl-r);
                    background: var(--aic-fill);
                    font-size: 14px;
                    font-weight: 500;
                    text-overflow: ellipsis;
                    transition: background 0.18s ease-in-out;
                }
                .preset select:hover {
                    background: var(--aic-fill-hover);
                }
                .preset select:disabled {
                    opacity: 0.5;
                    cursor: default;
                }
                .preset ha-icon {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .preset .lead { left: 12px; color: var(--aic-muted); }
                .preset .chevron { right: 10px; color: var(--aic-muted); }
                /* labelled toggles: HA badge-like pills, tinted when on */
                .chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .chip {
                    position: relative;
                    height: 36px;
                    padding: 0 14px 0 10px;
                    border-radius: 18px;
                    background: transparent;
                    box-shadow: inset 0 0 0 1px var(--aic-line);
                    color: var(--aic-muted);
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: background 0.18s ease-in-out, color 0.18s ease-in-out, box-shadow 0.18s ease-in-out, transform 0.12s ease-in-out;
                }
                .chip ha-icon { --mdc-icon-size: 18px; }
                .chip:hover {
                    background: var(--aic-fill);
                }
                /* actions are filled buttons, so they never read as an "off" switch */
                .chip.action {
                    background: var(--aic-fill);
                    box-shadow: none;
                    color: var(--aic-fg);
                }
                .chip.action:hover {
                    background: var(--aic-fill-hover);
                }
                .chip.action:active {
                    transform: scale(0.96);
                }
                .chip.on, .chip.fired {
                    background: var(--aic-accent-fill);
                    box-shadow: none;
                    color: var(--aic-accent);
                }
                .chip:disabled, .chip.disabled {
                    opacity: 0.45;
                    cursor: default;
                }
                .chip .value {
                    opacity: 0.75;
                }
                .chip select {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    font-size: 16px; /* no iOS zoom on focus */
                }
                @container (max-width: 419px) {
                    .panel-row { flex-wrap: wrap; }
                    .preset { flex: 1 1 100%; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .panel { transition: none; }
                }
            </style>
        `);

        const padHTML = pad.length ? `<div class="pad" role="group">${pad.map(([path, icon]) => `
            <button type="button" class="ctl" data-ptz="${path}" data-i18n="ptz_${path}"><ha-icon icon="${icon}"></ha-icon></button>
        `).join('')}</div>` : '';
        const presetHTML = this.config.preset ? `
            <label class="preset">
                <ha-icon class="lead" icon="mdi:star-outline"></ha-icon>
                <select data-i18n="preset"></select>
                <ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
            </label>` : '';
        // actions (scripts, buttons: quick replies) get their own row above everything else,
        // they are what you reach for during a call; switches and selects go last
        const isAction = item => !!ACTION_SERVICES[item.entity.split('.')[0]];
        const chipRow = (cls, test, render) => {
            const html = this._toggles.map((item, index) => test(item) ? render(item, index) : '').join('');
            return html ? `<div class="chips ${cls}">${html}</div>` : '';
        };
        const iconOf = item => `<ha-icon icon="${escapeHTML(item.icon || 'mdi:toggle-switch-outline')}"></ha-icon>`;
        const actionsHTML = chipRow('actions', isAction, (item, index) =>
            `<button type="button" class="chip action" data-run="${index}">${iconOf(item)}<span class="label"></span></button>`);
        const chipsHTML = chipRow('switches', item => !isAction(item), (item, index) => item.entity.startsWith('select.')
            ? `<label class="chip" data-pick="${index}">${iconOf(item)}<span class="label"></span><span class="value"></span><select></select></label>`
            : `<button type="button" class="chip" data-toggle="${index}" aria-pressed="false">${iconOf(item)}<span class="label"></span></button>`);
        const rowHTML = padHTML || presetHTML || this.talkPlace === 'panel'
            ? `<div class="panel-row">${this.talkPlace === 'panel' ? '<span class="talk-slot"></span>' : ''}${padHTML}${presetHTML}</div>` : '';

        this.querySelector('.ui').insertAdjacentHTML('beforeend', `
            <div class="panel"><div class="panel-inner"><div class="panel-body">${actionsHTML}${rowHTML}${chipsHTML}</div></div></div>
        `);
        const panel = this.querySelector('.panel');

        // `talk: panel` moves the talk button from the toolbar into the panel
        const slot = panel.querySelector('.talk-slot');
        if (slot) {
            slot.replaceWith(this.querySelector('.talk'));
            this.updatePrimaryGroup();
        }

        // open / closed is remembered per camera in this browser
        const storageKey = 'speakeasy-card:panel:' + (this.config.entity || this.config.url || '');
        let open = false;
        try {
            open = localStorage.getItem(storageKey) === '1';
        } catch (e) { /* storage may be blocked */ }
        const toggle = this.querySelector('.tools .panel-toggle');
        const setOpen = value => {
            panel.classList.toggle('open', value);
            panel.querySelector('.panel-inner').inert = !value;
            toggle.classList.toggle('on', value);
            toggle.setAttribute('aria-expanded', String(value));
        };
        toggle.hidden = false;
        setOpen(open);
        toggle.addEventListener('click', () => {
            open = !open;
            setOpen(open);
            try {
                localStorage.setItem(storageKey, open ? '1' : '0');
            } catch (e) { /* ignore */ }
        });

        // PTZ: press / release / long press, same payload semantics as the overlay
        panel.addEventListener('pointerdown', startEvt => {
            const button = startEvt.target.closest('[data-ptz]');
            if (!button || startEvt.button > 0) return;
            const path = button.dataset.ptz;
            startEvt.preventDefault();
            this.ptzCall('start_' + path);
            window.addEventListener('pointerup', endEvt => {
                this.ptzCall('end_' + path);
                this.ptzCall((endEvt.timeStamp - startEvt.timeStamp > 400 ? 'long_' : '') + path);
            }, {once: true});
        });
        panel.addEventListener('click', ev => {
            const ptzButton = ev.target.closest('[data-ptz]');
            if (ptzButton && ev.detail === 0) this.ptzCall(ptzButton.dataset.ptz); // keyboard
            const chip = ev.target.closest('[data-toggle]');
            if (chip && this.hass) {
                const item = this._toggles[parseInt(chip.dataset.toggle, 10)];
                this.hass.callService('homeassistant', 'toggle', {entity_id: item.entity});
            }
            const run = ev.target.closest('[data-run]');
            if (run && this.hass) {
                const item = this._toggles[parseInt(run.dataset.run, 10)];
                const [domain, service] = ACTION_SERVICES[item.entity.split('.')[0]];
                // a short tint confirms the tap; a running script stays tinted via its state
                run.classList.add('fired');
                clearTimeout(run._firedTimer);
                run._firedTimer = setTimeout(() => run.classList.remove('fired'), 1200);
                Promise.resolve(this.hass.callService(domain, service, {entity_id: item.entity}))
                    .catch(err => this.notify(this.t('actionFailed') + ': ' + (err && err.message || err)));
            }
        });
        panel.querySelectorAll('[data-pick] select').forEach(pick => {
            pick.addEventListener('change', () => {
                const item = this._toggles[parseInt(pick.parentElement.dataset.pick, 10)];
                if (this.hass && pick.value) {
                    this.hass.callService('select', 'select_option', {entity_id: item.entity, option: pick.value});
                }
            });
        });

        const select = panel.querySelector('.preset select');
        if (select) {
            select.addEventListener('change', () => {
                const option = select.value;
                select.value = ''; // an action, not a state: the same preset can be chosen again
                if (option && this.hass) {
                    this.hass.callService('select', 'select_option', {entity_id: this.config.preset, option});
                }
            });
        }

        this._presetOptions = null;
        this.applyLabels();
        this.updateCameraBar();
    }

    /** Event badges over the video (motion, person, doorbell): shown only while active. */
    renderIndicators() {
        this._indicators = (this.config.indicators || []).map(item => typeof item === 'string' ? {entity: item} : item);
        if (!this._indicators.length) return;
        this.querySelector('.status').insertAdjacentHTML('afterend', `<div class="indicators" role="status">${
            this._indicators.map((item, index) => `
                <span class="indicator" data-indicator="${index}"${item.color ? ` style="--aic-indicator: ${escapeHTML(item.color)}"` : ''} hidden>
                    <ha-icon icon="${escapeHTML(item.icon || 'mdi:alert-circle-outline')}"></ha-icon><span class="label"></span>
                </span>`).join('')}</div>`);
        this.updateIndicators();
    }

    /**
     * A `binary_sensor` (or any on/off entity) shows while `on`; an `event` entity, whose state is
     * the time of its last event, shows for `hold` seconds after it (default 60).
     */
    updateIndicators() {
        const root = this.shadowRoot ? this.querySelector('.indicators') : null;
        if (!root || !this.hass) return;
        const now = Date.now();
        let nextExpiry = Infinity;
        root.querySelectorAll('[data-indicator]').forEach(badge => {
            const item = this._indicators[parseInt(badge.dataset.indicator, 10)];
            const state = this.hass.states[item.entity];
            let active = false;
            if (state && item.entity.startsWith('event.')) {
                const until = Date.parse(state.state) + (item.hold || 60) * 1000;
                active = until > now;
                if (active) nextExpiry = Math.min(nextExpiry, until);
            } else if (state) {
                active = state.state === 'on';
            }
            badge.hidden = !active;
            badge.querySelector('.label').textContent =
                this.loc(item.name) || (state && state.attributes.friendly_name) || item.entity;
        });
        clearTimeout(this._indicatorTimer);
        if (nextExpiry < Infinity) {
            this._indicatorTimer = setTimeout(() => this.updateIndicators(), nextExpiry - now + 50);
        }
    }

    /** Sync toggles and the preset list with Home Assistant state. */
    updateCameraBar() {
        const panel = this.shadowRoot ? this.querySelector('.panel') : null;
        if (!panel || !this.hass) return;
        const states = this.hass.states;
        const nameOf = (item, state) => this.loc(item.name) || (state && state.attributes.friendly_name) || item.entity;

        panel.querySelectorAll('[data-toggle]').forEach(chip => {
            const item = this._toggles[parseInt(chip.dataset.toggle, 10)];
            const state = states[item.entity];
            const on = !!state && state.state === 'on';
            chip.classList.toggle('on', on);
            chip.setAttribute('aria-pressed', String(on));
            chip.disabled = !state || state.state === 'unavailable';
            chip.querySelector('.label').textContent = nameOf(item, state);
        });

        panel.querySelectorAll('[data-run]').forEach(chip => {
            const item = this._toggles[parseInt(chip.dataset.run, 10)];
            const state = states[item.entity];
            chip.classList.toggle('on', !!state && state.state === 'on'); // a script while it runs
            chip.disabled = !state || state.state === 'unavailable';
            chip.querySelector('.label').textContent = nameOf(item, state);
        });

        panel.querySelectorAll('[data-pick]').forEach(chip => {
            const item = this._toggles[parseInt(chip.dataset.pick, 10)];
            const state = states[item.entity];
            const value = state ? state.state : '';
            const options = (state && state.attributes.options) || [];
            const labels = item.options || {};
            const label = option => this.loc(labels[option]) || option;
            const select = chip.querySelector('select');
            const key = options.map(label).join('\n');
            if (select.dataset.key !== key) {
                select.dataset.key = key;
                select.innerHTML = options.map(option =>
                    `<option value="${escapeHTML(option)}">${escapeHTML(label(option))}</option>`).join('');
            }
            select.value = options.includes(value) ? value : '';
            const unavailable = !state || value === 'unavailable' || !options.length;
            select.disabled = unavailable;
            chip.classList.toggle('disabled', unavailable);
            chip.classList.toggle('on', (item.on_states || ['on']).includes(value));
            chip.querySelector('ha-icon').icon = (item.icons && item.icons[value]) || item.icon || 'mdi:form-dropdown';
            const name = nameOf(item, state);
            chip.querySelector('.label').textContent = name;
            chip.querySelector('.value').textContent = unavailable ? '' : label(value);
            select.setAttribute('aria-label', unavailable ? name : `${name}: ${label(value)}`);
        });

        const select = panel.querySelector('.preset select');
        if (!select) return;
        const state = states[this.config.preset];
        const options = (state && state.attributes.options) || [];
        const key = this.lang + '\n' + options.join('\n');
        if (key === this._presetOptions) return;
        this._presetOptions = key;
        const placeholder = this.t(options.length ? 'preset' : 'noPresets');
        select.innerHTML = `<option value="" disabled selected hidden>${escapeHTML(placeholder)}</option>` +
            options.map(option => `<option value="${escapeHTML(option)}">${escapeHTML(option)}</option>`).join('');
        select.value = '';
        select.disabled = !options.length || state.state === 'unavailable';
    }

    saveScreenshot() {
        const a = document.createElement('a');

        if (this.video.videoWidth && this.video.videoHeight) {
            const canvas = document.createElement('canvas');
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);
            a.href = canvas.toDataURL('image/jpeg');
        } else if (this.video.poster && this.video.poster.startsWith('data:image/jpeg')) {
            a.href = this.video.poster;
        } else {
            return;
        }

        const ts = new Date().toISOString().substring(0, 19).replace(/[-:]/g, '');
        a.download = `snapshot_${ts}.jpeg`;
        a.click();
    }

    renderCustomUI() {
        if (!this.config.ui) return;

        this.querySelector('ha-card').classList.add('ui-on');
        this.video.controls = false;
        this.video.style.pointerEvents = 'none';

        /** Two-row layout of the control bar, scoped to `scope` (repeated per breakpoint). */
        const compactCSS = scope => `
            ${scope} { flex-wrap: wrap; gap: 8px; }
            ${scope} .primary { flex: 1 1 100%; }
            ${scope} .talk { flex: 1 1 auto; height: 40px; border-radius: 20px; }
            ${scope} .segmented button { height: 40px; }
            ${scope} .talk[hidden] + .segmented { flex: 1 1 auto; }
            ${scope} .talk[hidden] + .segmented button { flex: 1 1 0; }
            ${scope} .tools { flex: 1 1 100%; margin-left: 0; justify-content: space-between; }
        `;

        const card = this.querySelector('.card');
        card.insertAdjacentHTML('beforebegin', `
            <style>
                .ui {
                    /* Home Assistant control styling: theme colours, neutral tints at 20%, 12px radius */
                    --aic-fg: var(--primary-text-color, #212121);
                    --aic-muted: var(--secondary-text-color, #727272);
                    --aic-line: var(--divider-color, rgba(0, 0, 0, 0.12));
                    --aic-fill: rgba(127, 127, 127, 0.14);
                    --aic-fill: color-mix(in srgb, var(--disabled-color, #bdbdbd) 22%, transparent);
                    --aic-fill-hover: color-mix(in srgb, var(--disabled-color, #bdbdbd) 34%, transparent);
                    --aic-thumb: var(--ha-card-background, var(--card-background-color, #fff));
                    --aic-accent: var(--primary-color, #03a9f4);
                    --aic-accent-fill: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent);
                    --aic-green: var(--success-color, #43a047);
                    --aic-red: var(--error-color, #db4437);
                    --aic-ctl-h: 42px;
                    --aic-ctl-r: var(--ha-border-radius-lg, 12px);
                    --aic-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
                    container-type: inline-size;
                    flex: none;
                    background: var(--aic-bar-bg, transparent);
                }
                :host(:fullscreen) .ui, :fullscreen .ui {
                    --aic-bar-bg: #000;
                    --aic-fg: #fff;
                    --aic-muted: rgba(255, 255, 255, 0.7);
                    --aic-line: rgba(255, 255, 255, 0.2);
                    --aic-thumb: #636366;
                }
                .spinner {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 1;
                }
                .controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 8px 8px 12px;
                    color: var(--aic-fg);
                }
                .ui {
                    font-family: var(--ha-font-family-body, Roboto, sans-serif);
                    -webkit-font-smoothing: antialiased;
                }
                .primary {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .tools {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    margin-left: auto;
                }
                .controls button {
                    appearance: none;
                    -webkit-appearance: none;
                    border: 0;
                    margin: 0;
                    font: inherit;
                    color: inherit;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                    -webkit-user-select: none;
                }
                .controls button:focus-visible {
                    outline: 2px solid var(--aic-accent);
                    outline-offset: 2px;
                }
                .controls ha-icon {
                    color: inherit;
                    pointer-events: none;
                    --mdc-icon-size: 20px;
                    transition: transform 0.4s var(--aic-ease);
                }
                /* toolbar: quiet icon buttons (ha-icon-button), a tint only on hover / when on */
                .btn {
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    border-radius: 50%;
                    background: transparent;
                    color: var(--aic-muted) !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: none;
                    transition: background 0.18s ease-in-out, color 0.18s ease-in-out;
                }
                .btn:hover {
                    background: var(--aic-fill);
                    color: var(--aic-fg) !important;
                }
                .btn.on {
                    background: var(--aic-accent-fill);
                    color: var(--aic-accent) !important;
                }
                /* talk: ha-button "filled" success (soft tint), solid danger while talking */
                .talk {
                    height: 36px;
                    padding: 0 16px 0 12px;
                    border: 0;
                    border-radius: 18px;
                    background: color-mix(in srgb, var(--aic-green) 18%, transparent);
                    color: var(--aic-green) !important;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    white-space: nowrap;
                    cursor: pointer;
                    flex: none;
                    transition: background 0.18s ease-in-out, color 0.18s ease-in-out, transform 0.12s ease-in-out, opacity 0.2s;
                }
                .talk ha-icon {
                    --mdc-icon-size: 20px;
                    pointer-events: none;
                }
                .talk:hover {
                    background: color-mix(in srgb, var(--aic-green) 28%, transparent);
                }
                .talk:active {
                    transform: scale(0.96);
                }
                .talk.active {
                    background: var(--aic-red);
                    color: #fff !important;
                    animation: aic-pulse 1.8s var(--aic-ease) infinite;
                }
                .talk.pending {
                    opacity: 0.6;
                    pointer-events: none;
                }
                @keyframes aic-pulse {
                    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--aic-red) 45%, transparent); }
                    70% { box-shadow: 0 0 0 8px transparent; }
                    100% { box-shadow: 0 0 0 0 transparent; }
                }
                .segmented {
                    display: inline-flex;
                    padding: 2px;
                    gap: 2px;
                    border-radius: var(--aic-ctl-r);
                    background: var(--aic-fill);
                    flex: none;
                }
                .segmented button {
                    height: 32px;
                    min-width: 44px;
                    padding: 0 12px;
                    border-radius: calc(var(--aic-ctl-r) - 2px);
                    background: transparent;
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                    opacity: 0.7;
                    transition: background 0.25s var(--aic-ease), box-shadow 0.25s var(--aic-ease), opacity 0.2s;
                }
                .segmented button:hover {
                    opacity: 1;
                }
                .segmented button.selected {
                    opacity: 1;
                    background: var(--aic-thumb);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(0, 0, 0, 0.04);
                    cursor: default;
                }
                /*
                 * Narrow cards (phones, masonry columns): talk + quality on top, tools spread below,
                 * so both rows span the full width.
                 * The breakpoint depends on what the bar holds (classes set in updatePrimaryGroup),
                 * so a single-stream camera without the quality switch keeps one row for longer.
                 */
                @container (max-width: 499px) {
                    ${compactCSS('.controls.has-talk.has-streams')}
                }
                @container (max-width: 399px) {
                    ${compactCSS('.controls.has-talk')}
                    ${compactCSS('.controls.has-streams')}
                }
                @container (max-width: 329px) {
                    ${compactCSS('.controls')}
                }
                @media (prefers-reduced-motion: reduce) {
                    .talk.active { animation: none; }
                    .controls ha-icon { transition: none; }
                }
                .stats-overlay {
                    position: absolute;
                    bottom: 12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(28, 28, 30, 0.55);
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    color: rgba(255, 255, 255, 0.95);
                    font: 600 11px/16px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
                    font-variant-numeric: tabular-nums;
                    padding: 4px 12px;
                    border-radius: 999px;
                    border: 0.5px solid rgba(255, 255, 255, 0.18);
                    pointer-events: auto;
                    cursor: pointer;
                    user-select: none;
                    transition: opacity 0.25s var(--aic-ease, ease), transform 0.25s var(--aic-ease, ease);
                    z-index: 3;
                    letter-spacing: 0.2px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                    white-space: nowrap;
                }
                .stats-overlay.hidden {
                    opacity: 0;
                    pointer-events: none;
                    transform: translateX(-50%) translateY(6px);
                }
            </style>
        `);

        // spinner and stats float over the video; the control bar lives below it
        this.querySelector('.player').insertAdjacentHTML('beforeend', `
            <ha-circular-progress class="spinner"></ha-circular-progress>
            <div class="stats-overlay hidden" data-i18n="statsHint"></div>
        `);
        card.insertAdjacentHTML('beforeend', `
            <div class="ui">
                <div class="controls">
                    <div class="primary">
                        <button type="button" class="talk" data-action="talk" hidden>
                            <ha-icon icon="mdi:microphone"></ha-icon>
                            <span class="label"></span>
                        </button>
                        <div class="segmented" role="radiogroup" data-i18n="quality" hidden></div>
                    </div>
                    <div class="tools">
                        <button type="button" class="btn play" data-action="play" data-i18n="play"><ha-icon icon="mdi:pause"></ha-icon></button>
                        <button type="button" class="btn volume" data-action="volume" data-i18n="volume" hidden><ha-icon icon="mdi:volume-high"></ha-icon></button>
                        <button type="button" class="btn reconnect" data-action="reconnect" data-i18n="reconnect"><ha-icon icon="mdi:refresh"></ha-icon></button>
                        <button type="button" class="btn screenshot" data-action="screenshot" data-i18n="screenshot"><ha-icon icon="mdi:camera-outline"></ha-icon></button>
                        <button type="button" class="btn info" data-action="info" data-i18n="info" aria-pressed="false"><ha-icon icon="mdi:information-outline"></ha-icon></button>
                        <button type="button" class="btn pictureinpicture" data-action="pip" data-i18n="pip"><ha-icon icon="mdi:picture-in-picture-bottom-right"></ha-icon></button>
                        <button type="button" class="btn fullscreen" data-action="fullscreen" data-i18n="fullscreen"><ha-icon icon="mdi:fullscreen"></ha-icon></button>
                        <button type="button" class="btn panel-toggle" data-i18n="cameraControls" aria-expanded="false" hidden><ha-icon icon="mdi:tune-variant"></ha-icon></button>
                    </div>
                </div>
            </div>
        `);
        this.querySelector('.stats-overlay').innerText = this.t('noData');
        this.applyLabels();

        // `tools` picks which toolbar buttons exist at all
        this._tools = this.config.tools || ALL_TOOLS;
        for (const tool of ALL_TOOLS) {
            if (!this._tools.includes(tool)) this.querySelector('.tools [data-action="' + tool + '"]').remove();
        }

        const video = this.video;
        // a removed tool (see `tools`) resolves to a dummy, so its listeners stay harmless
        const icon = selector => this.querySelector(selector + ' ha-icon') || {};

        const fullscreen = this.querySelector('.fullscreen');
        if (this.requestFullscreen) {
            this.addEventListener('fullscreenchange', () => {
                icon('.fullscreen').icon = document.fullscreenElement ? 'mdi:fullscreen-exit' : 'mdi:fullscreen';
            });
        } else if (video.webkitEnterFullscreen) {
            this.requestFullscreen = () => new Promise((resolve, reject) => {
                try {
                    video.webkitEnterFullscreen();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
            video.addEventListener('webkitendfullscreen', () => {
                setTimeout(() => this.play(), 1000); // fix bug in iOS
            });
        } else if (fullscreen) {
            fullscreen.hidden = true;
        }

        const pip = this.querySelector('.pictureinpicture');
        if (video.requestPictureInPicture) {
            video.addEventListener('enterpictureinpicture', () => {
                icon('.pictureinpicture').icon = 'mdi:rectangle';
                this.background = true;
            });
            video.addEventListener('leavepictureinpicture', () => {
                icon('.pictureinpicture').icon = 'mdi:picture-in-picture-bottom-right';
                this.background = this.config.background;
                this.play();
            });
        } else if (pip) {
            pip.hidden = true;
        }

        this.querySelector('.ui').addEventListener('click', ev => {
            const button = ev.target.closest('[data-action]');
            if (!button) return;
            switch (button.dataset.action) {
                case 'play':
                    if (video.paused) this.play();
                    else video.pause();
                    break;
                case 'volume':
                    video.muted = !video.muted;
                    break;
                case 'fullscreen':
                    if (document.fullscreenElement) document.exitFullscreen().catch(console.warn);
                    else this.requestFullscreen().catch(console.warn);
                    break;
                case 'pip':
                    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(console.warn);
                    else video.requestPictureInPicture().catch(console.warn);
                    break;
                case 'reconnect':
                    this.reconnect();
                    break;
                case 'stream':
                    this.selectStream(parseInt(button.dataset.index, 10));
                    break;
                case 'screenshot':
                    this.saveScreenshot();
                    break;
                case 'info':
                    this.toggleStats();
                    break;
                case 'talk':
                    this.toggleMicrophone();
                    break;
            }
        });
        this.querySelector('.stats-overlay').addEventListener('click', () => this.toggleStats());

        const spinner = this.querySelector('.spinner');
        video.addEventListener('waiting', () => {
            spinner.style.display = 'block';
        });
        video.addEventListener('playing', () => {
            spinner.style.display = 'none';
        });

        video.addEventListener('play', () => {
            icon('.play').icon = 'mdi:pause';
        });
        video.addEventListener('pause', () => {
            icon('.play').icon = 'mdi:play';
        });

        const volume = this.querySelector('.volume');
        video.addEventListener('loadeddata', () => {
            if (volume) volume.hidden = !this.hasAudio;
        });
        video.addEventListener('volumechange', () => {
            icon('.volume').icon = video.muted ? 'mdi:volume-off' : 'mdi:volume-high';
        });

        this.updateStreamSwitcher();
        this.updateTalkButton();
        this.startStats();
    }

    /** Segmented HD / SD / LD control, shown only when there is something to switch to. */
    updateStreamSwitcher() {
        const segmented = this.querySelector('.segmented');
        if (!segmented) return;
        const streams = this.config.streams;
        segmented.hidden = streams.length < 2;
        segmented.innerHTML = streams.map((_, index) => {
            const selected = index === this.streamID;
            return `<button type="button" role="radio" data-action="stream" data-index="${index}"
                aria-checked="${selected}" class="${selected ? 'selected' : ''}">${escapeHTML(this.streamLabel(index))}</button>`;
        }).join('');
        this.updatePrimaryGroup();
    }

    /** The talk button exists only for streams that carry a microphone track. */
    updateTalkButton() {
        const talk = this.querySelector('.talk');
        if (!talk) return;
        talk.hidden = this.media.indexOf('microphone') < 0 || this.talkPlace === false;
        this.updatePrimaryGroup();
    }

    /** Collapse the left group when it is empty so the tools row does not keep a gap. */
    updatePrimaryGroup() {
        const primary = this.querySelector('.primary');
        if (!primary) return;
        primary.hidden = !Array.from(primary.children).some(el => !el.hidden);
        const controls = this.querySelector('.controls');
        const talk = primary.querySelector('.talk'); // absent when it lives in the camera panel
        controls.classList.toggle('has-talk', !!talk && !talk.hidden);
        controls.classList.toggle('has-streams', !this.querySelector('.segmented').hidden);
    }

    /** @param state {'idle'|'active'|'pending'} */
    setTalkState(state) {
        const talk = this.querySelector('.talk');
        if (!talk) return;
        talk.classList.toggle('active', state === 'active');
        talk.classList.toggle('pending', state === 'pending');
        talk.querySelector('ha-icon').icon = state === 'active' ? 'mdi:ear-hearing' : 'mdi:microphone';
        talk.querySelector('.label').innerText =
            this.t(state === 'active' ? 'listen' : state === 'pending' ? 'connecting' : 'talk');
    }

    onmicchange(active) {
        this.setTalkState(active ? 'active' : 'idle');
    }

    toggleStats() {
        const statsEl = this.querySelector('.stats-overlay');
        if (!statsEl) return;
        const isHidden = statsEl.classList.toggle('hidden');
        const info = this.querySelector('.info');
        if (info) {
            info.classList.toggle('on', !isHidden);
            info.setAttribute('aria-pressed', String(!isHidden));
            info.querySelector('ha-icon').icon = isHidden ? 'mdi:information-outline' : 'mdi:information';
        }
        if (!isHidden) this.updateStats();
    }

    /**
     * Start or stop the microphone (2-way audio). Reports every failure to the user.
     */
    async toggleMicrophone() {
        if (this._micPending) return;

        if (this.micTrack) {
            this.stopMicrophone();
            return;
        }

        if (!window.isSecureContext) {
            this.notify(this.t('micNoHttps'));
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.notify(this.t('micUnsupported'));
            return;
        }

        const pc = this.pc;
        if (!pc || pc.connectionState !== 'connected') {
            this.notify(this.t('micNotConnected'));
            return;
        }

        let sender = this.micSender;
        let transceiver = null;
        if (sender) {
            transceiver = pc.getTransceivers().find(t => t.sender === sender) || null;
        } else {
            transceiver = pc.getTransceivers().find(t =>
                t.direction === 'sendonly' && t.receiver && t.receiver.track && t.receiver.track.kind === 'audio'
            ) || null;
            if (transceiver) sender = this.micSender = transceiver.sender;
        }

        if (!sender) {
            this.notify(this.t('micNoChannel'));
            return;
        }
        if (transceiver && transceiver.currentDirection &&
            transceiver.currentDirection !== 'sendonly' && transceiver.currentDirection !== 'sendrecv') {
            this.notify(this.t('micNoBackchannel'));
            return;
        }

        this._micPending = true;
        this.setTalkState('pending');

        let stream = null;
        try {
            const audioConstraints = {
                audio: {
                    echoCancellation: {ideal: true},
                    noiseSuppression: {ideal: true},
                    autoGainControl: {ideal: true},
                },
                video: false,
            };
            try {
                stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            } catch (e) {
                stream = await navigator.mediaDevices.getUserMedia({audio: true});
            }
            const track = stream.getAudioTracks()[0];
            if (!track) throw new Error(this.t('micNoTrack'));

            // the connection may have changed while the permission prompt was open
            if (this.pc !== pc || pc.signalingState === 'closed') {
                throw new Error(this.t('micReconnected'));
            }
            await sender.replaceTrack(track);

            this.micStream = stream;
            this.micTrack = track;
            track.addEventListener('ended', () => {
                if (this.micTrack === track) this.stopMicrophone();
            });
            this.onmicchange(true);
        } catch (err) {
            console.warn('Microphone error:', err);
            if (stream) {
                try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
            }
            this.onmicchange(false);
            if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                this.notify(this.t('micDenied'));
            } else if (err && err.name === 'NotFoundError') {
                this.notify(this.t('micNotFound'));
            } else {
                this.notify(this.t('micFailed') + ((err && (err.message || err.name)) || err));
            }
        } finally {
            this._micPending = false;
        }
    }

    startStats() {
        if (this._statsInterval || !this.config.ui) return;
        this._statsLastBytes = 0;
        this._statsLastTime = 0;
        this._statsLastPc = null;
        this._statsInterval = setInterval(() => this.updateStats(), 1500);
    }

    stopStats() {
        if (!this._statsInterval) return;
        clearInterval(this._statsInterval);
        this._statsInterval = 0;
    }

    async updateStats() {
        const el = this.querySelector('.stats-overlay');
        if (!el || el.classList.contains('hidden')) return;

        const parts = [];
        if (this.video && this.video.videoWidth) {
            parts.push(`${this.video.videoWidth}x${this.video.videoHeight}`);
        }

        const pc = this.pc;
        if (!pc) {
            // MSE / HLS / MJPEG: no RTC statistics, show what we know
            const modeEl = this.querySelector('.mode');
            const mode = modeEl ? modeEl.innerText : '';
            if (mode && mode.indexOf('Loading') < 0) parts.unshift(mode);
            el.innerText = parts.length ? parts.join(' • ') : this.t('noData');
            return;
        }

        if (pc !== this._statsLastPc) {
            // bytesReceived restarts from zero on every new connection
            this._statsLastPc = pc;
            this._statsLastBytes = 0;
            this._statsLastTime = 0;
        }

        if (pc.connectionState !== 'connected') {
            el.innerText = this.t('connecting');
            return;
        }

        try {
            const stats = await pc.getStats();
            let fps = null;
            let currentBytes = null;
            let rtt = null;
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    if (report.framesPerSecond !== undefined) fps = Math.round(report.framesPerSecond);
                    currentBytes = report.bytesReceived;
                } else if (report.type === 'candidate-pair' && (report.state === 'succeeded' || report.nominated)) {
                    if (report.currentRoundTripTime !== undefined) {
                        rtt = Math.round(report.currentRoundTripTime * 1000);
                    }
                }
            });

            const now = performance.now();
            let bitRateStr = '';
            if (currentBytes !== null && this._statsLastBytes > 0 && currentBytes >= this._statsLastBytes) {
                const dt = (now - this._statsLastTime) / 1000;
                if (dt > 0.5) {
                    const bps = ((currentBytes - this._statsLastBytes) * 8) / dt;
                    bitRateStr = bps >= 1000000
                        ? (bps / 1000000).toFixed(1) + ' Mbps'
                        : Math.round(bps / 1000) + ' kbps';
                }
            }
            if (currentBytes !== null) {
                this._statsLastBytes = currentBytes;
                this._statsLastTime = now;
            }

            if (fps !== null) parts.push(`${fps} fps`);
            if (bitRateStr) parts.push(bitRateStr);
            if (rtt !== null) parts.push(`${rtt} ms`);

            el.innerText = parts.length ? parts.join(' • ') : this.t('noData');
        } catch (e) {
            // pc closed between the check and getStats() - next tick will recover
        }
    }

    renderShortcuts() {
        if (!this.config.shortcuts) return;

        const card = this.querySelector('.card');
        card.insertAdjacentHTML('beforebegin', `
            <style>
                .shortcuts {
                    position: absolute;
                    top: 5px;
                    left: 5px;
                }
            </style>
        `);
        card.insertAdjacentHTML('beforeend', '<div class="shortcuts"></div>');

        const shortcuts = this.querySelector('.shortcuts');
        shortcuts.addEventListener('click', ev => {
            const index = ev.target.dataset ? ev.target.dataset.index : undefined;
            const value = index !== undefined ? this.config.shortcuts[index] : undefined;
            if (!value) return;
            if (value.more_info !== undefined) {
                const event = new Event('hass-more-info', {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                });
                event.detail = {entityId: value.more_info};
                ev.target.dispatchEvent(event);
            }
            if (value.service !== undefined) {
                const [domain, name] = value.service.split('.');
                this.hass.callService(domain, name, value.service_data || {});
            }
        });

        shortcuts.innerHTML = this.config.shortcuts.map((value, index) => `
            <ha-icon data-index="${index}" icon="${escapeHTML(value.icon || '')}" title="${escapeHTML(value.name || '')}"></ha-icon>
        `).join('');
    }

    renderStyle() {
        if (!this.config.style) return;

        const style = document.createElement('style');
        style.textContent = String(this.config.style);
        this.querySelector('.card').insertAdjacentElement('beforebegin', style);
    }

    get hasAudio() {
        return (
            (this.video.srcObject && this.video.srcObject.getAudioTracks && this.video.srcObject.getAudioTracks().length) ||
            (this.video.mozHasAudio || this.video.webkitAudioDecodedByteCount) ||
            (this.video.audioTracks && this.video.audioTracks.length)
        );
    }
}

// the module can be loaded twice (two dashboard resources, or the same file under
// a new ?v= in an open tab); a second define() would throw
if (!customElements.get('speakeasy-card')) {
    customElements.define('speakeasy-card', SpeakeasyCard);

    window.customCards = window.customCards || [];
    window.customCards.push({
        type: 'speakeasy-card',
        name: 'Speakeasy',
        preview: false,
        description: 'Doorbell, intercom and camera card: WebRTC video, push-to-talk two-way audio, HD/SD/LD stream switching and mobile-friendly controls',
    });

    console.info(`speakeasy-card ${VERSION}`);
}

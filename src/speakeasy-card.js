/**
 * Speakeasy - doorbell, intercom and camera card for Home Assistant.
 *
 * Based on WebRTC Camera by AlexxIT (https://github.com/AlexxIT/WebRTC, MIT).
 * Layout needs CSS container queries and color-mix(): Chrome 111+, Safari 16.2+, Firefox 113+.
 */
import {VideoRTCExt} from './video-rtc-ext.js';
import {DigitalPTZ} from '../vendor/digital-ptz.js';

const VERSION = '0.2.0';

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
        more: 'More',
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
        record: 'Record',
        recordStop: 'Stop recording',
        recordStarting: 'Starting recording…',
        recordSaving: 'Saving the recording…',
        recordStartLost: 'Connection lost while starting. If the recording started, the card shows it once reconnected',
        recordStartOffline: 'Recording not started: no connection to Home Assistant; try again',
        recordStopLost: 'Connection lost while saving. If the file is saved, it will be in Media',
        recordStopOffline: 'Recording not stopped: no connection to Home Assistant; try again',
        recordSaved: 'Recording saved: ',
        recordWhere: 'Find it in Media → ',
        recordOpen: 'Open',
        recordFailed: 'Recording failed: ',
        recordNoData: 'Recording failed: the file could not be saved',
        recordDataKept: 'Recording not saved yet: its data is kept, and saving is tried again when Home Assistant restarts or the integration reloads, if the recordings folder is unchanged',
        recordNotLoaded: 'Recording is unavailable: the Speakeasy integration is not loaded right now, e.g. while Home Assistant starts or the integration reloads; try again shortly',
        recordDiskLow: 'Recording is unavailable: not enough free disk space',
        recordNoStream: 'Recording failed: go2rtc cannot open the stream. ',
        recordCameraAsleep: 'Recording failed: the camera did not answer. It may be asleep or offline; try again',
        recordStartStopped: 'Recording not started: it was stopped, or Home Assistant was stopping, before the camera sent data',
        recordNoMediaDir: 'Recording is unavailable: Home Assistant has no local media folder',
        recordFolderNotWritable: 'Recording failed: cannot write to the recordings folder. ',
        recordEnded_disk_low: 'Recording stopped: not enough free disk space',
        recordEnded_stalled: 'Recording stopped: the camera stopped sending data',
        recordEnded_stream_ended: 'Recording stopped: the stream ended',
        recordEnded_error: 'Recording stopped because of an error',
        recordEnded_shutdown: 'Recording stopped: Home Assistant stopped or restarted, or the Speakeasy integration was reloaded, disabled or removed',
        recordEndedUnseen: 'The recording ended while the connection was down. If it was saved, the file is in Media',
        recordAlreadyEnded: 'The recording had already ended. If it was saved, the file is in Media',
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
        more: 'Ещё',
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
        record: 'Запись',
        recordStop: 'Остановить запись',
        recordStarting: 'Запуск записи…',
        recordSaving: 'Сохранение записи…',
        recordStartLost: 'Связь прервалась во время запуска. Если запись началась, карточка покажет её после переподключения',
        recordStartOffline: 'Запись не начата: нет связи с Home Assistant; попробуйте ещё раз',
        recordStopLost: 'Связь прервалась во время сохранения. Если файл сохранится, он будет в Медиа',
        recordStopOffline: 'Запись не остановлена: нет связи с Home Assistant; попробуйте ещё раз',
        recordSaved: 'Запись сохранена: ',
        recordWhere: 'Файл в Медиа → ',
        recordOpen: 'Открыть',
        recordFailed: 'Не удалось записать: ',
        recordNoData: 'Не удалось записать: файл не сохранился',
        recordDataKept: 'Запись пока не сохранена: данные остались, сохранение повторится при перезапуске Home Assistant или перезагрузке интеграции, если папка записей не изменится',
        recordNotLoaded: 'Запись недоступна: интеграция Speakeasy сейчас не загружена, например пока Home Assistant запускается или интеграция перезагружается; попробуйте ещё раз чуть позже',
        recordDiskLow: 'Запись недоступна: мало свободного места на диске',
        recordNoStream: 'Не удалось записать: go2rtc не открывает поток. ',
        recordCameraAsleep: 'Не удалось записать: камера не ответила. Возможно, она спит или недоступна; попробуйте ещё раз',
        recordStartStopped: 'Запись не начата: её остановили или Home Assistant останавливался до того, как камера прислала данные',
        recordNoMediaDir: 'Запись недоступна: в Home Assistant нет локальной папки «Медиа»',
        recordFolderNotWritable: 'Не удалось записать: нет доступа на запись в папку записей. ',
        recordEnded_disk_low: 'Запись остановлена: мало свободного места на диске',
        recordEnded_stalled: 'Запись остановлена: камера перестала присылать данные',
        recordEnded_stream_ended: 'Запись остановлена: поток закончился',
        recordEnded_error: 'Запись остановлена из-за ошибки',
        recordEnded_shutdown: 'Запись остановлена: Home Assistant остановился или перезапустился, либо интеграцию Speakeasy перезагрузили, отключили или удалили',
        recordEndedUnseen: 'Запись завершилась, пока не было связи. Если файл сохранился, он в Медиа',
        recordAlreadyEnded: 'Запись уже завершилась. Если файл сохранился, он в Медиа',
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

const ALL_TOOLS = ['play', 'volume', 'reconnect', 'screenshot', 'record', 'info', 'pip', 'fullscreen'];

/**
 * Tools that move into the "more" menu when the bar is too narrow, least needed first.
 * The camera panel toggle is left out on purpose: it opens talk, PTZ and presets, too much to
 * hide behind "more", so it always stays in the row (and "more" itself is never a candidate).
 */
const OVERFLOW_ORDER = ['info', 'pip', 'reconnect', 'screenshot', 'play', 'volume', 'record', 'fullscreen'];

/** Control bar geometry the layout is computed from; the CSS below is built from these values. */
const BAR = {button: 40, toolGap: 2, groupGap: 8, primaryGap: 10};

/** Version of the Speakeasy integration protocol the card speaks (`speakeasy/info`). */
const RECORD_PROTOCOL = 1;

/** Toolbar look of the record button per state: icon and label key. */
const RECORD_STATES = {
    idle: ['mdi:record-circle-outline', 'record'],
    starting: ['mdi:record-circle-outline', 'recordStarting'],
    recording: ['mdi:record', 'recordStop'],
    saving: ['mdi:content-save-outline', 'recordSaving'],
};

/**
 * Reasons a recording ends without a Stop that the user should hear about. 'shutdown' (HA stopping,
 * the entry unloading) too: on a reload nothing else on the page says why the recording ended.
 */
const RECORD_END_REASONS = ['disk_low', 'stalled', 'stream_ended', 'error', 'shutdown'];

/**
 * Stop errors that tell how the recording ended, as notices. Already over, and Stop may have beaten
 * the reconnect `list`, which then no longer tells about it: not_found, stopped elsewhere or ended
 * while the card was offline; unknown_command, a restarted HA has not loaded the integration (yet);
 * not_configured, no loaded entry, and an unload stops every recording. no_data and data_kept: the
 * `failed` event, on this card or another of this source, has usually told it already.
 */
const STOP_ERROR_NOTICES = new Map([
    ['not_found', 'recordAlreadyEnded'],
    ['unknown_command', 'recordAlreadyEnded'],
    ['not_configured', 'recordAlreadyEnded'],
    ['no_data', 'recordNoData'],
    ['data_kept', 'recordDataKept'],
]);

/** True for home-assistant-js-websocket's ERR_CONNECTION_LOST, bare or wrapped in an error result. */
const isConnectionLost = err => err === 3 || !!(err && err.error && err.error.code === 3);

/**
 * Recordings whose ending this page has told, by id: one ending, one notice. Every card of a source
 * hears the same event (HA would show the same toast once per card), and a stop's reply, an event
 * and a reconnect `list` may each tell the same ending, in different words; the first wins. Only the
 * latest RECORD_NOTICES_KEPT are kept, oldest out first: a page left open for months must not grow,
 * and an ending is told within moments, long before that many newer ones come.
 */
const recordNoticesTold = new Set();
const RECORD_NOTICES_KEPT = 200;

/**
 * Why recordings now saving ended, by id, held from the stopping a card of their source heard
 * until their stopped or failed, so a save that fails gives one notice, not two. Per page, not per
 * card: a card removed or re-added meanwhile (another view, a closed popup) must not lose it, so
 * whichever card hears the outcome tells it, and a `list` without the recording tells it too.
 * Held with the camera's name as that card calls it: {reason, name}.
 */
const recordEndsUntold = new Map();

/** Cards following the recordings; when the last one stops, nothing would hear the held outcomes. */
const recordFollowers = new Set();

/** `speakeasy/info` per Home Assistant connection, so many cards make one call: {promise, failedFor}. */
const recorderInfo = new WeakMap();

/**
 * Integration info if it supports recording (protocol RECORD_PROTOCOL, feature `record`),
 * null otherwise. Not asked while the integration is not loaded (not installed, no enabled
 * config entry yet, or a starting HA has not got to it); any error gives null too. Those two
 * nulls are cached until a `recheck` call sees another config than the one they were asked
 * with; any answer is cached until a reconnect drops the cache.
 * @param {boolean} recheck pass true only with a fresh hass: an old one would undo a valid null
 * @return {Promise<Object|null>}
 */
const getRecorderInfo = (hass, recheck) => {
    const conn = hass.connection;
    let cache = recorderInfo.get(conn);
    if (!cache) {
        cache = {promise: null, failedFor: null};
        recorderInfo.set(conn, cache);
        // The Connection outlives a Home Assistant restart, which may add or remove the integration.
        // Added before any card's own 'ready' listener (initRecording), so cards re-ask after the drop.
        conn.addEventListener('ready', () => { cache.promise = null; });
    }
    // The frontend gets a new config object when an integration loads (also for a config entry
    // added while the page is open) and, right after a reconnect, when its get_config returns:
    // until then it passes the old config. Config changes are rare, so this does not flood HA.
    if (recheck && cache.failedFor && cache.failedFor !== hass.config) cache.promise = null;
    if (!cache.promise) {
        const config = hass.config;
        cache.failedFor = null;
        if (!config.components.includes('speakeasy')) {
            cache.failedFor = config;
            cache.promise = Promise.resolve(null);
        } else {
            const asked = cache.promise = hass.callWS({type: 'speakeasy/info'}).then(
                info => info && info.protocol === RECORD_PROTOCOL
                    && (info.features || []).includes('record') ? info : null,
                () => {
                    if (cache.promise === asked) cache.failedFor = config;
                    return null;
                },
            );
        }
    }
    return cache.promise;
};

/** Seconds as m:ss, or h:mm:ss from an hour on. */
const formatDuration = seconds => {
    const s = Math.max(0, Math.floor(seconds));
    const mmss = String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    return s >= 3600 ? Math.floor(s / 3600) + ':' + mmss : mmss;
};

/** Media folder of a `media-source://media_source/<dir>/<path>` id, for "Media → folder" hints. */
const mediaFolder = mediaContentId => {
    const parts = mediaContentId.replace(/^media-source:\/\/media_source\/[^/]+\/?/, '').split('/');
    parts.pop();
    return parts.join('/');
};

/** True inside the Home Assistant companion app, where `<a download>` may do nothing. */
const inCompanionApp = () => !!(window.externalApp
    || (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.externalBus));

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
        /** [internal] `speakeasy/info` result: undefined while asking, null when recording is unavailable. */
        this._recordInfo = undefined;
        /** [internal] the getRecorderInfo() promise asked last; _recordInfo is its answer once set. */
        this._recordInfoAsked = null;
        /** [internal] true when `set hass` came while initRecording could not ask; connectedCallback rechecks. */
        this._recheckPending = false;
        /** [internal] recordings of every source, by id, from `speakeasy/record/subscribe`. */
        this._recordings = new Map();
        /**
         * [internal] promise of the unsubscribe function (resolving to null if subscribing failed), set
         * from the subscribe request until dropSubscription(), so initRecording does not subscribe twice.
         */
        this._recordUnsub = null;
        /** [internal] a config entry is loaded, so a recording can start: from `info`, then every `list`. */
        this._recordConfigured = false;
        /** [internal] connection whose 'ready' calls onReconnect, from the first subscribe until the card is removed. */
        this._readyConn = null;
        this.onReconnect = this.onReconnect.bind(this);
        /** [internal] 'starting' or 'stopping' while this card waits for the integration. */
        this._recordBusy = null;
        /** [internal] recording timer id. */
        this._recordTimer = 0;
        /** [internal] delayed unsubscribeRecordings() after the card left the DOM. */
        this._unsubTimer = 0;
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
        if (config.record_url !== undefined && typeof config.record_url !== 'string') {
            throw new Error('`record_url` must be a go2rtc source');
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
         *     record_url: string,
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
        this.initRecording(true);
    }

    connectedCallback() {
        clearTimeout(this._unsubTimer);
        super.connectedCallback();
        // a recheck only for a hass set while detached (hui-card sets it before appending): a cached
        // view comes back with its old hass, the fresh one follows
        this.initRecording(this._recheckPending);
        this._recheckPending = false;
        // re-arm the recording timer: updateRecordButton() does not start it while the card is detached
        this.updateRecordButton();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.shadowRoot) this.closeMoreMenu();
        // VideoRTC also calls this on a hidden tab or a card scrolled out of view: keep following
        if (this.isConnected) return;
        // and a re-parented card (masonry columns) comes back soon: keep the subscription and the tray.
        // Not via onsuspend(): VideoRTCExt never suspends a `background` card, yet a removed one
        // must stop following, or its leftover copy would toast every recording event.
        clearTimeout(this._unsubTimer);
        this._unsubTimer = setTimeout(() => {
            if (!this.isConnected) this.unsubscribeRecordings();
        }, this.DISCONNECT_TIMEOUT);
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
        this.toast({message});
    }

    /** Show an HA toast; `hass-notification` is handled on `home-assistant`. */
    toast(detail) {
        // a card detached meanwhile (e.g. the user switched views during an await) is not
        // under `home-assistant`, so its event would reach no one
        const target = this.isConnected ? this : (document.querySelector('home-assistant') || this);
        target.dispatchEvent(new CustomEvent('hass-notification', {
            detail,
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
                    this.setStatus(msg.type.toUpperCase(), this.loc(this.config.title));
                    break;
            }
        };

        return result;
    }

    onpcvideo(ev) {
        super.onpcvideo(ev);

        if (this.pcState !== WebSocket.CLOSED) {
            this.setStatus('RTC', this.loc(this.config.title));
        }
    }

    renderMain() {
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
        <style>
            :host {
                display: flex;
                flex-direction: column;
                /* pinned to a fixed-height slot (Sections rows); height stays auto, so a stack still
                   stretches it: a % height would block that, a % min/max is ignored when indefinite */
                min-height: 100%;
                max-height: 100%;
            }
            ha-card {
                width: 100%;
                height: 100%;
                box-sizing: border-box; /* the border stays inside, so the card is exactly as wide as the tray */
                /* in a fixed-height slot the card, and the player in it, give way to the open tray */
                flex: 1 1 auto;
                min-height: 0;
                z-index: 1; /* over the status tray that slides out from under it */
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
                flex: 0 1 auto;
                min-height: 0;
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
                /* repeats flex/min-height at (0,2,1): a config ha-card rule, inserted later, cannot override these two in fullscreen */
                flex: 1 1 auto;
                min-height: 0;
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
                .panel button:focus-visible, .panel select:focus-visible {
                    outline: 2px solid var(--aic-accent);
                    outline-offset: 2px;
                }
                /* apart: Firefox before 121 has no :has() and would drop the whole selector list */
                .chip:has(select:focus-visible) {
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

    /**
     * Event badges (motion, person, doorbell), shown only while active: in the status tray under the
     * card, so they never cover the picture; over the video when the control bar is off.
     */
    renderIndicators() {
        this._indicators = (this.config.indicators || []).map(item => typeof item === 'string' ? {entity: item} : item);
        if (!this._indicators.length) return;
        const statusBody = this.querySelector('.status-bar-body');
        (statusBody || this.querySelector('.status')).insertAdjacentHTML(statusBody ? 'afterbegin' : 'afterend', `<div class="indicators" role="status">${
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
        this.updateStatusBar();
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

    /**
     * Ask the integration, then follow the recordings while the card is on the page.
     * @param {boolean} recheck true only with a fresh hass: from `set hass`, or from connectedCallback
     *     when one came while the card was detached; see getRecorderInfo()
     */
    initRecording(recheck = false) {
        if (this._recordUnsub) return;
        if (!this._hass || !this.isConnected || !this._tools || !this._tools.includes('record')) {
            // a fresh hass on a detached card: connectedCallback rechecks
            if (recheck) this._recheckPending = true;
            return;
        }
        // cached per connection; a new promise means the answer was dropped and is asked again
        const asked = getRecorderInfo(this._hass, recheck);
        if (asked !== this._recordInfoAsked) {
            this._recordInfoAsked = asked;
            // the old answer must not let the next call subscribe before this one is in
            this._recordInfo = undefined;
            asked.then(info => {
                if (this._recordInfoAsked !== asked) return;
                this._recordInfo = info;
                this._recordConfigured = !!(info && info.configured);
                // An answer subscribes; the `list` that follows (or the subscribe catch) shows the
                // recordings. A null one keeps them, hidden: the `list` after the next answer (a
                // recheck or 'ready', not re-asked here) replaces them and tells what ended meanwhile.
                if (info) this.initRecording();
                else this.updateRecordButton();
            });
            return;
        }
        if (!this._recordInfo) return;
        const conn = this._hass.connection;
        // HA-js would resubscribe by itself on a reconnect, before 'ready', and silently drop a
        // resubscribe that fails (unknown_command while a restarted HA is still starting): the
        // card does it on 'ready' instead, after getRecorderInfo's listener (added on its first call).
        if (this._readyConn !== conn) {
            if (this._readyConn) this._readyConn.removeEventListener('ready', this.onReconnect);
            conn.addEventListener('ready', this.onReconnect);
            this._readyConn = conn;
        }
        recordFollowers.add(this);
        const pending = conn.subscribeMessage(
            event => this.onRecordEvent(event), {type: 'speakeasy/record/subscribe'}, {resubscribe: false},
        ).then(unsub => {
            // HA dropped it with its socket. HA-js before 9.8 would still send the unsubscribe on
            // the next socket, where ids start over, and end whichever subscription took this id.
            const socket = conn.socket;
            return () => conn.socket === socket && unsub();
        }).catch(err => {
            // Only HA itself refuses it: the connection is lost, and 'ready' subscribes again, or
            // the integration is not loaded, which needs a restart, so again 'ready'. Left pending
            // till then, so a `set hass` does not subscribe again.
            console.debug('speakeasy-card: no recording updates:', err);
            // kept over a reconnect for the next `list`, which tells what ended meanwhile;
            // otherwise no `list` will come and they may be over
            if (this._recordUnsub === pending && !isConnectionLost(err)) {
                this._recordings = new Map();
                this.updateRecordButton();
            }
            return null;
        });
        this._recordUnsub = pending;
    }

    /** Drop the subscription; one still being set up is unsubscribed once it is in. */
    dropSubscription() {
        const unsub = this._recordUnsub;
        this._recordUnsub = null;
        if (unsub) unsub.then(fn => fn && fn()).catch(() => {});
    }

    /** The card was removed: stop following the recordings. */
    unsubscribeRecordings() {
        this.dropSubscription();
        this._recordings = new Map();
        // the page heard these endings, and no card is left to hear how their saves end
        if (recordFollowers.delete(this) && !recordFollowers.size) {
            for (const [id, {reason, name}] of recordEndsUntold) this.tellRecordEnded(id, reason, name);
        }
        this.updateRecordButton();
        // not from onReconnect: removing a listener while 'ready' fires skips the next one
        if (this._readyConn) this._readyConn.removeEventListener('ready', this.onReconnect);
        this._readyConn = null;
    }

    /**
     * The connection is back: HA has dropped the subscription with the old socket, and a restart
     * may have added or removed the integration, so ask again (the cached answer is already
     * dropped) and subscribe again. The recordings stay on show until the new `list` replaces
     * them, so the button and the tray do not flicker; a null answer hides them.
     */
    onReconnect() {
        this.dropSubscription();
        this.initRecording();
    }

    /** What this card records: always the first (HD) stream, or `record_url` over it. */
    get recordSource() {
        const stream = this.config.streams[0];
        // trimmed, as the integration keeps them: the card finds its recording by the same `url`
        const source = stream.entity ? {entity: stream.entity} : {url: String(stream.url).trim()};
        if (this.config.server) source.server = this.config.server;
        const recordUrl = (this.config.record_url || '').trim();
        if (recordUrl) source.record_url = recordUrl;
        return source;
    }

    /**
     * Whether a recording, from whichever device, is of this card's source. Compared as the
     * integration keys a source: the entity id lowercased (it echoes it so, the start reply's
     * fallback entry keeps ours as written), url exact, server trimmed of space and '/'.
     */
    isOwnRecording(recording) {
        const own = this.recordSource;
        const source = recording.source || {};
        const entity = value => (value || '').toLowerCase();
        const server = value => (value || '').trim().replace(/\/+$/, '');
        return (source.url || '') === (own.url || '') && entity(source.entity) === entity(own.entity)
            && server(source.server) === server(own.server);
    }

    /**
     * This card's recording: the running one, else the first one still saving. One source can have
     * a new recording running while older ones are still being saved.
     */
    findRecording() {
        let saving = null;
        for (const recording of this._recordings.values()) {
            if (!this.isOwnRecording(recording)) continue;
            if (recording.status === 'recording') return recording;
            saving = saving || recording;
        }
        return saving;
    }

    /**
     * @param {{event: string, configured: boolean, recordings: Array, recording: Object, reason: string,
     *     kept: boolean, result: Object}} event
     */
    onRecordEvent(event) {
        switch (event.event) {
            case 'list': {
                // While subscribed, a recording turns saving in a `list` only after its stopping, and
                // leaves it only after its stopped/failed. One of ours that was running and is now
                // saving or gone ended while there was no subscription (e.g. the connection was
                // down). Still saving, it carries why, held for its outcome as its missed stopping
                // would have been, even while our stop waits: our own stop would give 'user'. Gone,
                // the reason is unknown, and a pending stop answers for it. A saving one was heard of.
                const old = this.findRecording();
                this._recordings = new Map(event.recordings.map(recording => [recording.id, recording]));
                this._recordConfigured = !!event.configured;
                // its stopped/failed was missed: the reason still holds, whatever the outcome
                for (const [id, {reason, name}] of recordEndsUntold) {
                    if (!this._recordings.has(id)) this.tellRecordEnded(id, reason, name);
                }
                const now = old && this._recordings.get(old.id);
                if (old && old.status === 'recording') {
                    if (!now) {
                        if (this._recordBusy !== 'stopping') {
                            this.notifyRecording(old.id, this.recordingName(old), 'recordEndedUnseen');
                        }
                    } else if (now.status === 'saving') this.holdRecordEnd(now, now.reason);
                }
                break;
            }
            case 'started':
                this._recordings.set(event.recording.id, event.recording);
                break;
            case 'stopping':
                this._recordings.set(event.recording.id, event.recording);
                // told with its stopped or failed: a failed save tells only that
                if (this.isOwnRecording(event.recording)) this.holdRecordEnd(event.recording, event.reason);
                break;
            case 'stopped': {
                this._recordings.delete(event.recording.id);
                // saved: why it ended, held since its stopping (by any card, the one that heard it may be gone)
                const held = recordEndsUntold.get(event.recording.id);
                if (held) this.tellRecordEnded(event.recording.id, held.reason, held.name);
                break;
            }
            case 'failed': {
                // Not saved: kept false, nothing was saved (the file could not be written, or was
                // removed); kept true, the data stays as .part and the integration tries to save it
                // at its next start (HA restart or reload), if its recordings folder is then still
                // the one the part is in.
                // Told instead of why it ended. Only one the card still shows is news, as is a held
                // one (its card may be gone). Our own stop's no_data/data_kept reply is the same
                // notice, deduped by notifyRecording.
                const known = this._recordings.has(event.recording.id);
                this._recordings.delete(event.recording.id);
                const held = recordEndsUntold.get(event.recording.id);
                recordEndsUntold.delete(event.recording.id);
                if (held || (known && this.isOwnRecording(event.recording))) {
                    const name = held ? held.name : this.recordingName(event.recording);
                    this.notifyRecording(event.recording.id, name, event.kept === true ? 'recordDataKept' : 'recordNoData');
                }
                break;
            }
        }
        this.updateRecordButton();
    }

    /**
     * Tell, once per page, why a recording ended without a Stop (not 'user'), and drop it from
     * recordEndsUntold. For ours, and for one held there by any card (its card may be gone).
     */
    tellRecordEnded(id, reason, name) {
        recordEndsUntold.delete(id);
        if (RECORD_END_REASONS.includes(reason)) this.notifyRecording(id, name, 'recordEnded_' + reason);
    }

    /**
     * Hold why our recording ended till its save ends: see recordEndsUntold. Every card of the source
     * hears it, so the name held is the first titled card's, or the integration's if none has a title.
     */
    holdRecordEnd(recording, reason) {
        const held = recordEndsUntold.get(recording.id);
        const title = this.recordingTitle(recording);
        if (held && (held.titled || !title)) return;
        recordEndsUntold.set(recording.id, {reason, name: title || recording.name || '', titled: !!title});
    }

    /** This card's title for its own recording, else ''. */
    recordingTitle(recording) {
        return (this.isOwnRecording(recording) && this.loc(this.config.title)) || '';
    }

    /**
     * The camera a notice is about: this card's title for its own recording, else the name the
     * integration gives (the entity's name, a go2rtc stream name, or a URL cut to scheme, host and port).
     */
    recordingName(recording) {
        return this.recordingTitle(recording) || recording.name || '';
    }

    /**
     * Show the notice about a recording's ending once per page, so a stop's reply or another card does
     * not repeat it. Named, since several can end at once (e.g. HA restarting) and their toasts stack.
     */
    notifyRecording(id, name, key) {
        if (recordNoticesTold.has(id)) return;
        recordNoticesTold.add(id);
        // a Set iterates in insertion order: the first is the oldest
        if (recordNoticesTold.size > RECORD_NOTICES_KEPT) {
            recordNoticesTold.delete(recordNoticesTold.values().next().value);
        }
        this.notify(name ? name + ' — ' + this.t(key) : this.t(key));
    }

    updateRecordButton() {
        const button = this.querySelector('.controls .record'); // in the bar or in "more"
        if (!button) return;
        // no config entry: nothing to press; an unload's recordings still show till they end
        button.hidden = !this._recordInfo || !this._recordConfigured;

        const recording = this._recordInfo ? this.findRecording() : null;
        let state = 'idle';
        if (this._recordBusy === 'stopping' || (recording && recording.status === 'saving')) state = 'saving';
        else if (recording) state = 'recording';
        else if (this._recordBusy === 'starting') state = 'starting';

        const [icon, label] = RECORD_STATES[state];
        button.dataset.state = state;
        button.disabled = state === 'starting' || state === 'saving';
        button.querySelector('ha-icon').icon = icon;
        if (button.dataset.i18n !== label) {
            button.dataset.i18n = label;
            button.title = this.t(label);
            button.setAttribute('aria-label', button.title);
        }

        const badge = this.querySelector('.rec-badge');
        const time = badge.querySelector('.rec-time');
        const tick = () => {
            time.textContent = formatDuration((Date.now() - Date.parse(recording.started_at)) / 1000);
        };
        clearInterval(this._recordTimer);
        this._recordTimer = 0;
        badge.hidden = state !== 'recording';
        this.updateStatusBar();
        if (state === 'recording') {
            tick();
            // a reply or an event may land on a detached card; connectedCallback re-arms it
            if (this.isConnected) this._recordTimer = setInterval(tick, 1000);
        }
    }

    async toggleRecording() {
        if (this._recordBusy) return;
        const recording = this.findRecording();
        if (recording) {
            if (recording.status === 'recording') await this.stopRecording(recording);
            return;
        }

        this._recordBusy = 'starting';
        this.updateRecordButton();
        // as in stopRecording(): a closed socket fails the call the same way, without sending it
        const connected = this.hass.connection.connected;
        try {
            const source = this.recordSource;
            const started = await this.hass.callWS({type: 'speakeasy/record/start', source});
            // normally the subscription has it already; this covers a missing subscription
            if (!this._recordings.has(started.id)) {
                this._recordings.set(started.id, {...started, source, status: 'recording'});
            }
        } catch (err) {
            // lost after sending: it may have started, and the `list` after the reconnect shows it
            if (isConnectionLost(err)) this.notify(this.t(connected ? 'recordStartLost' : 'recordStartOffline'));
            else this.notify(this.recordError(err));
        } finally {
            this._recordBusy = null;
            this.updateRecordButton();
        }
    }

    async stopRecording(recording) {
        this._recordBusy = 'stopping';
        this.updateRecordButton();
        let result = null;
        let unsent = false;
        // a closed socket fails the call with the same connection-lost error, without sending it
        const connected = this.hass.connection.connected;
        try {
            // replies once the file is final
            result = await this.hass.callWS({type: 'speakeasy/record/stop', recording_id: recording.id});
        } catch (err) {
            // Sent, it was probably delivered, and the integration finishes the file without us; the
            // `list` after the reconnect brings the entry back while it is still saving.
            if (isConnectionLost(err)) {
                unsent = !connected;
                this.notify(this.t(connected ? 'recordStopLost' : 'recordStopOffline'));
            }
            else if (err && STOP_ERROR_NOTICES.has(err.code)) {
                this.notifyRecording(recording.id, this.recordingName(recording), STOP_ERROR_NOTICES.get(err.code));
            } else if (err) this.notify(this.recordError(err));
        } finally {
            // not stopped, so the entry stays and Stop can be pressed again
            if (!unsent) this._recordings.delete(recording.id);
            this._recordBusy = null;
            this.updateRecordButton();
        }
        // It may have ended by itself before Stop reached it, unseen: e.g. ended while the card was
        // offline and Stop beat the reconnect `list`.
        if (result) {
            this.tellRecordEnded(result.id, result.reason, this.recordingName(recording));
            await this.downloadRecording(result);
        }
    }

    /** @param {{code: string, message: string}} err */
    recordError(err) {
        const code = err && err.code;
        // Record is shown only while loaded and configured, so these are races: a start sent while
        // a restarted HA has not loaded the integration yet (unknown_command), or whose checks span an
        // unload, e.g. a reload (not_configured). A removed or failed entry hides the button anyway.
        if (code === 'unknown_command' || code === 'not_configured') return this.t('recordNotLoaded');
        if (code === 'disk_low') return this.t('recordDiskLow');
        // the integration has already waited for the camera to wake up
        if (code === 'camera_unavailable') return this.t('recordCameraAsleep');
        // A stop ended the start before the first data: an action or HA stopping during its checks
        // (the camera's stream source, the disk, the source's previous file still closing; an unload
        // there gives not_configured, above), or an action, an unload or HA stopping while it waited
        // for go2rtc's first data. Also a start asked while HA was stopping.
        if (code === 'stopped') return this.t('recordStartStopped');
        if (code === 'media_dir_missing') return this.t('recordNoMediaDir');
        // without a detail the integration sends the code itself as the message
        const detail = err && err.message && err.message !== code ? err.message : '';
        if (code === 'stream_not_found' || code === 'go2rtc_error') return this.t('recordNoStream') + detail;
        // the detail is the bare OS error, which does not say it is about the folder
        if (code === 'folder_not_writable') return this.t('recordFolderNotWritable') + detail;
        return this.t('recordFailed') + ((err && (err.message || err.code)) || String(err));
    }

    /**
     * Save the finished file on this device, like saveScreenshot(). The companion app
     * may ignore `<a download>`, so it gets a toast with a link instead.
     * @param {{filename: string, media_content_id: string}} result
     */
    async downloadRecording(result) {
        const folder = mediaFolder(result.media_content_id);
        const saved = this.t('recordSaved') + result.filename + '. ' + this.t('recordWhere') + folder;
        let url;
        try {
            const media = await this.hass.callWS({
                type: 'media_source/resolve_media',
                media_content_id: result.media_content_id,
                expires: 3600,
            });
            url = this.hass.hassUrl(media.url);
        } catch (err) {
            console.warn('speakeasy-card: cannot resolve the recording:', err);
            this.notify(saved);
            return;
        }

        if (inCompanionApp()) {
            this.toast({
                message: saved,
                duration: 15000,
                action: {text: this.t('recordOpen'), action: () => window.open(url, '_blank')},
            });
            return;
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
    }

    renderCustomUI() {
        if (!this.config.ui) return;

        this.querySelector('ha-card').classList.add('ui-on');
        this.video.controls = false;
        this.video.style.pointerEvents = 'none';

        const card = this.querySelector('.card');
        card.insertAdjacentHTML('beforebegin', `
            <style>
                .ui {
                    /* Home Assistant control styling: theme colours, neutral tints at 20%, 12px radius */
                    --aic-fg: var(--primary-text-color, #212121);
                    --aic-muted: var(--secondary-text-color, #727272);
                    --aic-line: var(--divider-color, rgba(0, 0, 0, 0.12));
                    --aic-fill: color-mix(in srgb, var(--disabled-color, #bdbdbd) 22%, transparent);
                    --aic-fill-hover: color-mix(in srgb, var(--disabled-color, #bdbdbd) 34%, transparent);
                    --aic-thumb: var(--ha-card-background, var(--card-background-color, #fff));
                    --aic-menu-bg: var(--ha-card-background, var(--card-background-color, #fff));
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
                    --aic-menu-bg: #2c2c2e;
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
                    gap: ${BAR.groupGap}px;
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
                    gap: ${BAR.primaryGap}px;
                    min-width: 0;
                }
                .tools {
                    display: flex;
                    align-items: center;
                    gap: ${BAR.toolGap}px;
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
                    width: ${BAR.button}px;
                    height: ${BAR.button}px;
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
                /* every label sits in one grid cell, so the button is as wide as the longest and never resizes */
                .talk .label {
                    display: grid;
                }
                .talk .label > span {
                    grid-area: 1 / 1;
                    text-align: center;
                }
                .talk .label > span:not(.current) {
                    visibility: hidden;
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
                /*
                 * record: a red dot while recording, a pulsing disk while saving. The button keeps its
                 * width in every state; the elapsed time is shown in the status tray under the card,
                 * so the bar never reflows.
                 */
                .btn.record[data-state="recording"] {
                    color: var(--aic-red) !important;
                }
                .btn.record[data-state="saving"] ha-icon {
                    animation: aic-blink 1s ease-in-out infinite alternate;
                }
                .btn.record:disabled {
                    cursor: default;
                    opacity: 0.6;
                }
                /*
                 * Status tray: event badges and the recording timer, off the picture. Not part of the
                 * card: it slides out from under the card's bottom edge, its top tucked under the card's
                 * rounded corners, its bottom rounded the same way, tinted by what is going on.
                 */
                .status-bar {
                    --aic-tray-r: var(--ha-card-border-radius, var(--ha-border-radius-lg, 12px));
                    --aic-tray-card: var(--ha-card-background, var(--card-background-color, #fff));
                    --aic-tray-fg: var(--primary-text-color, #212121);
                    display: grid;
                    grid-template-rows: 0fr;
                    margin-top: 0;
                    border-radius: 0 0 var(--aic-tray-r) var(--aic-tray-r);
                    background: color-mix(in srgb, var(--aic-tray, #db4437) 22%, var(--aic-tray-card));
                    font-family: var(--ha-font-family-body, Roboto, sans-serif);
                    -webkit-font-smoothing: antialiased;
                    /* rows and margin move together, so the card + tray height only ever grows or shrinks */
                    transition: grid-template-rows 0.3s var(--aic-ease, ease), margin-top 0.3s var(--aic-ease, ease),
                        background 0.3s ease-in-out;
                }
                /* folded, the tint changes at once: updateStatusBar sets it before the tray opens */
                .status-bar:not(.open) {
                    transition-property: grid-template-rows, margin-top;
                }
                .status-bar.open {
                    grid-template-rows: 1fr;
                    margin-top: calc(-1 * var(--aic-tray-r));
                }
                /* under the black fullscreen bar: dark chips, and square like the card there */
                :host(:fullscreen) .status-bar, :fullscreen .status-bar {
                    --aic-tray-card: #2c2c2e;
                    --aic-tray-fg: #fff;
                    --aic-tray-r: 0px;
                }
                .status-bar-inner {
                    overflow: hidden;
                    min-height: 0;
                }
                .status-bar-body {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 6px;
                    padding: calc(var(--aic-tray-r) + 6px) 10px 8px;
                }
                /*
                 * repeats display/flex-wrap/gap at (0,2,0): a config .indicators rule, inserted
                 * later and meant for the badges over the video, cannot override these three in the tray
                 */
                .status-bar .indicators {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                /* chips in the card colour on the tinted tray, text in their own colour */
                .status-bar .indicator {
                    height: 26px;
                    box-sizing: border-box;
                    padding: 0 10px 0 8px;
                    gap: 5px;
                    background: var(--aic-tray-card);
                    color: color-mix(in srgb, var(--aic-indicator, #db4437) 78%, var(--aic-tray-fg));
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
                    font: 500 12px/16px var(--ha-font-family-body, Roboto, sans-serif);
                    letter-spacing: 0.1px;
                    animation: aic-chip-in 0.25s var(--aic-ease, ease);
                }
                .status-bar .indicator ha-icon {
                    --mdc-icon-size: 16px;
                }
                .rec-badge {
                    --aic-indicator: var(--error-color, #db4437);
                    margin-left: auto;
                    gap: 7px;
                    padding-left: 10px;
                    font-variant-numeric: tabular-nums;
                }
                .rec-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--error-color, #db4437);
                    animation: aic-blink 1s ease-in-out infinite alternate;
                }
                @keyframes aic-chip-in {
                    from { opacity: 0; transform: scale(0.92); }
                }
                @keyframes aic-blink {
                    50% { opacity: 0.35; }
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
                 * Two rows when one does not fit (layoutControls measures it): talk + quality on top,
                 * tools spread below, both rows full width.
                 */
                .controls.compact { flex-wrap: wrap; }
                .controls.compact .primary { flex: 1 1 100%; }
                .controls.compact .talk { flex: 1 1 auto; height: 40px; border-radius: 20px; }
                .controls.compact .segmented button { height: 40px; }
                /* quality alone on its row: talk hidden, or moved into the panel (talk: panel) */
                .controls.compact .talk[hidden] + .segmented,
                .controls.compact .segmented:first-child { flex: 1 1 auto; }
                .controls.compact .talk[hidden] + .segmented button,
                .controls.compact .segmented:first-child button { flex: 1 1 0; }
                .controls.compact .tools { flex: 1 1 100%; margin-left: 0; justify-content: space-between; }
                /* "more": tools that do not fit even a row of their own; a popover, so the card cannot clip it */
                .more-menu {
                    position: fixed;
                    inset: auto;
                    margin: 0;
                    padding: 6px;
                    border: 0;
                    border-radius: var(--aic-ctl-r);
                    background: var(--aic-menu-bg);
                    color: var(--aic-fg);
                    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22), 0 1px 3px rgba(0, 0, 0, 0.12);
                    flex-direction: column;
                    gap: 2px;
                    min-width: 180px;
                    overflow-y: auto; /* scrolls when capped to the card (no Popover API) */
                    font-family: var(--ha-font-family-body, Roboto, sans-serif);
                    -webkit-font-smoothing: antialiased;
                    z-index: 10;
                }
                .more-menu:not(.open) {
                    display: none;
                }
                .more-menu.open {
                    display: flex;
                    animation: aic-menu-in 0.16s var(--aic-ease);
                }
                .more-menu .btn {
                    width: auto;
                    min-width: 0;
                    height: 40px;
                    padding: 0 14px 0 10px;
                    gap: 12px;
                    border-radius: calc(var(--aic-ctl-r) - 4px);
                    justify-content: flex-start;
                    color: var(--aic-fg) !important;
                }
                .more-menu .btn::after {
                    content: attr(aria-label);
                    font-size: 14px;
                    white-space: nowrap;
                }
                @keyframes aic-menu-in {
                    from { opacity: 0; transform: translateY(4px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .talk.active { animation: none; }
                    .controls ha-icon { transition: none; }
                    .btn.record ha-icon, .rec-dot { animation: none !important; }
                    .more-menu.open, .status-bar .indicator { animation: none; }
                    .status-bar { transition: none; }
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
                            <span class="label"><span data-state="idle"></span><span data-state="active"></span><span data-state="pending"></span></span>
                        </button>
                        <div class="segmented" role="radiogroup" data-i18n="quality" hidden></div>
                    </div>
                    <div class="tools">
                        <button type="button" class="btn play" data-action="play" data-i18n="play"><ha-icon icon="mdi:pause"></ha-icon></button>
                        <button type="button" class="btn volume" data-action="volume" data-i18n="volume" hidden><ha-icon icon="mdi:volume-high"></ha-icon></button>
                        <button type="button" class="btn reconnect" data-action="reconnect" data-i18n="reconnect"><ha-icon icon="mdi:refresh"></ha-icon></button>
                        <button type="button" class="btn screenshot" data-action="screenshot" data-i18n="screenshot"><ha-icon icon="mdi:camera-outline"></ha-icon></button>
                        <button type="button" class="btn record" data-action="record" data-i18n="record" data-state="idle" hidden><ha-icon icon="mdi:record-circle-outline"></ha-icon></button>
                        <button type="button" class="btn info" data-action="info" data-i18n="info" aria-pressed="false"><ha-icon icon="mdi:information-outline"></ha-icon></button>
                        <button type="button" class="btn pictureinpicture" data-action="pip" data-i18n="pip"><ha-icon icon="mdi:picture-in-picture-bottom-right"></ha-icon></button>
                        <button type="button" class="btn fullscreen" data-action="fullscreen" data-i18n="fullscreen"><ha-icon icon="mdi:fullscreen"></ha-icon></button>
                        <button type="button" class="btn panel-toggle" data-i18n="cameraControls" aria-expanded="false" hidden><ha-icon icon="mdi:tune-variant"></ha-icon></button>
                        <button type="button" class="btn more" data-i18n="more" aria-controls="more-menu" aria-expanded="false" hidden><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>
                    </div>
                    <div class="more-menu" id="more-menu" popover="manual"></div>
                </div>
            </div>
        `);
        // the status tray is not part of the card: it slides out from under its bottom edge
        card.insertAdjacentHTML('afterend', `
            <div class="status-bar"><div class="status-bar-inner"><div class="status-bar-body">
                <div class="indicator rec-badge" role="timer" hidden><span class="rec-dot"></span><span class="rec-time"></span></div>
            </div></div></div>
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
            if (ev.target.closest('.more')) {
                this.toggleMoreMenu();
                return;
            }
            const button = ev.target.closest('[data-action]');
            if (!button) return;
            if (button.closest('.more-menu')) {
                // a manual popover does not restore focus: hiding the item would drop it to <body>.
                // Only when the item had it (keyboard, or a click outside Safari); an action that
                // moves focus itself still wins.
                const refocus = button === this.shadowRoot.activeElement;
                this.closeMoreMenu();
                if (refocus) this.querySelector('.tools .more').focus();
            }
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
                case 'record':
                    this.toggleRecording();
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
        this.observeControls();
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
    }

    /**
     * Fit the control bar to its width, whatever it holds: one row if everything fits, else talk +
     * quality on a row of their own, and the least needed tools behind "more" if even a full row of
     * tools does not fit. Runs on resize and whenever a control appears, disappears or changes.
     */
    layoutControls() {
        const controls = this.querySelector('.controls');
        if (!controls || !controls.clientWidth) return; // not rendered yet, or in a hidden tab
        const style = getComputedStyle(controls);
        const width = controls.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const primary = controls.querySelector('.primary');
        const tools = controls.querySelector('.tools');
        const more = tools.querySelector('.more');
        const menu = controls.querySelector('.more-menu');

        // natural width of talk + quality, read in the one-row layout where nothing is stretched
        controls.classList.remove('compact');
        const shown = primary.hidden ? [] : Array.from(primary.children).filter(el => !el.hidden);
        // the rect is exact but includes transforms (talk shrinks while pressed, and a press relabels
        // it, which lands here); offsetWidth ignores them, rounded to whole pixels
        const primaryWidth = shown.reduce((sum, el) => sum + Math.max(el.offsetWidth, el.getBoundingClientRect().width), 0)
            + BAR.primaryGap * Math.max(shown.length - 1, 0);

        // every tool is a BAR.button-wide icon button (record included: its timer lives in the status tray)
        const buttons = this._toolButtons.filter(button => !button.hidden);
        const row = count => count * BAR.button + Math.max(count - 1, 0) * BAR.toolGap;
        const oneRow = !primaryWidth || primaryWidth + BAR.groupGap + row(buttons.length) <= width;
        controls.classList.toggle('compact', !oneRow);

        // tools row too narrow: hand the least needed tools to "more", which takes a slot itself
        const overflow = new Set();
        if (row(buttons.length) > width) {
            const candidates = OVERFLOW_ORDER
                .map(action => buttons.find(button => button.dataset.action === action))
                .filter(Boolean);
            while (candidates.length && row(buttons.length - overflow.size + 1) > width) overflow.add(candidates.shift());
        }

        const key = this._toolButtons.map(button => (overflow.has(button) ? 1 : 0)).join('');
        if (key !== this._overflowKey) {
            this._overflowKey = key;
            const focused = this.shadowRoot.activeElement;
            this.closeMoreMenu();
            for (const button of this._toolButtons) {
                if (overflow.has(button)) menu.appendChild(button);
                else tools.insertBefore(button, more);
            }
            more.hidden = !overflow.size;
            // a moved or hidden node loses focus: give it back, or to "more" if it went into the closed menu
            if (focused && focused !== this.shadowRoot.activeElement) {
                // preventScroll: a resize while the card is off-screen must not pull the page back to it
                if (tools.contains(focused)) focused.focus({preventScroll: true});
                else if (menu.contains(focused) && !more.hidden) more.focus({preventScroll: true});
            }
        }
        // our own moves are not changes to react to
        this._barMutations.takeRecords();
    }

    /** The status bar slides out while it has something to show and folds away when it is empty. */
    updateStatusBar() {
        const bar = this.querySelector('.status-bar');
        if (!bar) return;
        const shown = Array.from(bar.querySelectorAll('.indicator')).filter(badge => !badge.hidden);
        // The tray takes the colour of what matters most: a recording, else the first event. Set
        // before it opens and kept when it folds, so the colour neither fades in from a stale tint
        // while it slides out nor flashes while it slides back.
        const lead = shown.find(badge => badge.classList.contains('rec-badge')) || shown[0];
        // '' (a badge without a colour) clears it, so the CSS fallback applies
        if (lead) bar.style.setProperty('--aic-tray', getComputedStyle(lead).getPropertyValue('--aic-indicator').trim());
        // apply the tint while folded (no background transition) before the tray opens
        if (lead && !bar.classList.contains('open')) getComputedStyle(bar).backgroundColor;
        bar.classList.toggle('open', shown.length > 0);
    }

    /** Re-run layoutControls on resize and whenever the content of the bar changes. */
    observeControls() {
        const controls = this.querySelector('.controls');
        this._toolButtons = Array.from(controls.querySelectorAll('.tools .btn:not(.more)'));
        let lastWidth = -1;
        new ResizeObserver(() => {
            if (controls.clientWidth === lastWidth) return; // a height change from our own reflow
            lastWidth = controls.clientWidth;
            this.layoutControls();
        }).observe(controls);
        this._barMutations = new MutationObserver(() => this.layoutControls());
        this._barMutations.observe(controls, {subtree: true, childList: true, attributes: true, attributeFilter: ['hidden']});
        // labels are measured in the web font; it may arrive after the first layout
        if (document.fonts) document.fonts.ready.then(() => this.layoutControls());
    }

    toggleMoreMenu() {
        const menu = this.querySelector('.more-menu');
        if (menu.classList.contains('open')) {
            this.closeMoreMenu();
            return;
        }
        const more = this.querySelector('.tools .more');
        menu.classList.add('open');
        // The top layer escapes the card's clipping. Old browsers lay it out inside the bar
        // (container-type makes .ui its containing block), where the card clips it.
        const popover = typeof menu.showPopover === 'function';
        if (popover) menu.showPopover();
        more.classList.add('on');
        more.setAttribute('aria-expanded', 'true');

        // anchor to "more": right edges aligned, above it if it fits, else on the side with more room
        const gap = 6; // px between "more" and its menu
        const base = popover
            ? {top: 0, right: document.documentElement.clientWidth, bottom: window.innerHeight}
            : this.querySelector('.ui').getBoundingClientRect();
        const anchor = more.getBoundingClientRect();
        let above;
        if (popover) {
            const height = menu.offsetHeight;
            above = anchor.top - height - gap >= 0 || anchor.top > window.innerHeight - anchor.bottom;
        } else {
            // inside the card there is no room below the bar, so it opens up and scrolls if taller
            above = true;
            const cardTop = this.querySelector('.card').getBoundingClientRect().top;
            const style = getComputedStyle(menu); // max-height excludes the padding
            const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            menu.style.maxHeight = Math.max(anchor.top - cardTop - 2 * gap - padding, 40) + 'px';
        }
        menu.style.right = Math.max(base.right - anchor.right, 0) + 'px';
        menu.style.bottom = above ? base.bottom - anchor.top + gap + 'px' : 'auto';
        menu.style.top = above ? 'auto' : anchor.bottom - base.top + gap + 'px';

        const close = () => this.closeMoreMenu();
        // Tab out of the menu closes it. A null relatedTarget (window switch, a click Safari does
        // not focus) is left to the outside pointerdown.
        const blur = ev => {
            const to = ev.relatedTarget;
            if (to && !menu.contains(to) && to !== more) close();
        };
        const outside = ev => {
            const path = ev.composedPath();
            if (!path.includes(menu) && !path.includes(more)) close();
        };
        const escape = ev => {
            if (ev.key !== 'Escape') return;
            close();
            more.focus();
        };
        // removed together by closeMoreMenu()
        this._moreMenuListeners = new AbortController();
        const {signal} = this._moreMenuListeners;
        document.addEventListener('pointerdown', outside, {capture: true, signal});
        document.addEventListener('keydown', escape, {capture: true, signal});
        window.addEventListener('scroll', close, {capture: true, signal});
        window.addEventListener('resize', close, {signal});
        menu.addEventListener('focusout', blur, {signal});
        more.addEventListener('focusout', blur, {signal});
    }

    closeMoreMenu() {
        const menu = this.querySelector('.more-menu');
        if (!menu || !menu.classList.contains('open')) return;
        menu.classList.remove('open');
        if (typeof menu.hidePopover === 'function' && menu.matches(':popover-open')) menu.hidePopover();
        const more = this.querySelector('.tools .more');
        more.classList.remove('on');
        more.setAttribute('aria-expanded', 'false');
        this._moreMenuListeners.abort();
    }

    /** @param state {'idle'|'active'|'pending'} */
    setTalkState(state) {
        const talk = this.querySelector('.talk');
        if (!talk) return;
        talk.classList.toggle('active', state === 'active');
        talk.classList.toggle('pending', state === 'pending');
        talk.querySelector('ha-icon').icon = state === 'active' ? 'mdi:ear-hearing' : 'mdi:microphone';
        const keys = {idle: 'talk', active: 'listen', pending: 'connecting'};
        talk.querySelectorAll('.label > span').forEach(label => {
            label.textContent = this.t(keys[label.dataset.state]);
            label.classList.toggle('current', label.dataset.state === state);
        });
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

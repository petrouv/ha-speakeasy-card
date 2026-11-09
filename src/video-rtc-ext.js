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
import {VideoRTC} from '../vendor/video-rtc.js';

export class VideoRTCExt extends VideoRTC {
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

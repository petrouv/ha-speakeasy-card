// Scenes for the README screenshots: card config, fake Home Assistant states and a still frame
// standing in for the stream. `crop` is [x, y, width, height] in frame pixels and must match the
// card's aspect_ratio: the video is letterboxed (object-fit: contain), not cropped.
export const SCENES = {
    'doorbell-goose': {
        theme: 'light',
        width: 400,
        frame: 'frames/goose-doorbell.png',   // 1024x1536
        crop: [0, 40, 1024, 1365],            // 3:4
        audio: true,
        talk: null,                           // 'active' shows a conversation in progress (Listen)
        panel: true,
        config: {
            type: 'custom:speakeasy-card',
            aspect_ratio: '3:4',
            media: 'video,audio,microphone',
            streams: [
                {url: 'doorbell_hd', name: 'HD'},
                {url: 'doorbell_sd', name: 'SD'},
                {url: 'doorbell_ld', name: 'LD'},
            ],
            toggles: [
                {entity: 'script.doorbell_say_one_minute', name: 'One minute', icon: 'mdi:timer-sand'},
                {entity: 'script.doorbell_say_leave_it', name: 'Leave it at the door', icon: 'mdi:package-variant-closed'},
                {entity: 'switch.doorbell_privacy', name: 'Privacy', icon: 'mdi:eye-off-outline'},
                {entity: 'switch.doorbell_chime', name: 'Chime', icon: 'mdi:bell-outline'},
            ],
            indicators: [
                {entity: 'event.doorbell_ring', name: 'Doorbell', icon: 'mdi:bell-ring', color: '#ff9800'},
                {entity: 'binary_sensor.doorbell_motion', name: 'Motion', icon: 'mdi:motion-sensor'},
            ],
        },
        states: {
            'script.doorbell_say_one_minute': 'off',
            'script.doorbell_say_leave_it': 'off',
            'switch.doorbell_privacy': 'off',
            'switch.doorbell_chime': 'on',
            'event.doorbell_ring': () => new Date().toISOString(),
            'binary_sensor.doorbell_motion': 'on',
        },
    },
    'camera-cat': {
        theme: 'dark',
        width: 640,
        frame: 'frames/cat-ir.png',           // 1536x1024
        crop: [0, 80, 1536, 864],             // 16:9
        audio: true,
        recording: 83,                        // seconds since a recording started; omit for no integration
        talk: null,
        panel: true,
        config: {
            type: 'custom:speakeasy-card',
            entity: 'camera.living_room',
            aspect_ratio: '16:9',
            media: 'video,audio',
            ptz: {
                service: 'button.press',
                position: 'bar',
                data_left: {entity_id: 'button.living_room_move_left'},
                data_up: {entity_id: 'button.living_room_move_up'},
                data_down: {entity_id: 'button.living_room_move_down'},
                data_right: {entity_id: 'button.living_room_move_right'},
            },
            preset: 'select.living_room_preset',
            toggles: [
                {entity: 'switch.living_room_privacy', name: 'Privacy', icon: 'mdi:eye-off-outline'},
                {entity: 'switch.living_room_auto_track', name: 'Auto track', icon: 'mdi:target-account'},
                {
                    entity: 'select.living_room_night_vision', name: 'IR', icon: 'mdi:weather-night',
                    options: {auto: 'Auto', on: 'On', off: 'Off'}, on_states: ['on', 'auto'],
                },
            ],
            indicators: [
                {entity: 'binary_sensor.living_room_pet', name: 'Pet', icon: 'mdi:cat', color: '#ff9800'},
            ],
        },
        states: {
            'switch.living_room_privacy': 'off',
            'switch.living_room_auto_track': 'on',
            'select.living_room_night_vision': ['auto', {options: ['auto', 'on', 'off']}],
            'select.living_room_preset': ['Sofa', {options: ['Sofa', 'Window', 'Door', 'Kitchen']}],
            'binary_sensor.living_room_pet': 'on',
        },
    },
};

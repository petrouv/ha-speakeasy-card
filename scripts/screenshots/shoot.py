#!/usr/bin/env python3
"""Re-render the README screenshots (images/*.jpg) from the built speakeasy-card.js.

The stand (stand.html) runs the real bundle in headless Chromium with stand-ins for the Home Assistant
frontend: a fake `hass`, minimal `ha-card` / `ha-icon` elements, and a still frame from frames/ in place
of the WebRTC stream. Scenes (card config, entity states, frame and crop) live in scenes.js.

Needs Playwright: pip install playwright && playwright install chromium

    python3 scripts/build.py                     # the stand uses the built bundle, rebuild first
    python3 scripts/screenshots/shoot.py         # all scenes
    python3 scripts/screenshots/shoot.py camera-cat
"""
import functools
import http.server
import json
import os
import re
import sys
import tempfile
import threading
import urllib.request

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(HERE))
OUT_DIR = os.path.join(ROOT_DIR, 'images')

MDI_VERSION = '7.4.47'
MDI_URL = f'https://cdn.jsdelivr.net/npm/@mdi/js@{MDI_VERSION}/mdi.js'
ICON_SOURCES = [os.path.join(ROOT_DIR, 'src', 'speakeasy-card.js'), os.path.join(HERE, 'scenes.js')]

JPEG_QUALITY = 85
SCALE = 2   # device pixel ratio: crisp on retina screens


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def fail(message):
    sys.exit(f'ERROR: {message}')


def icons_module():
    """JS module with the SVG paths of every mdi: icon the card and the scenes use."""
    cache = os.path.join(tempfile.gettempdir(), f'mdi-js-{MDI_VERSION}.js')
    if not os.path.exists(cache):
        with urllib.request.urlopen(MDI_URL, timeout=60) as response:
            data = response.read()
        with open(cache + '.part', 'wb') as f:
            f.write(data)
        os.replace(cache + '.part', cache)
    with open(cache, encoding='utf-8') as f:
        paths = dict(re.findall(r'export var (mdi\w+) = "([^"]+)"', f.read()))

    names = set()
    for source in ICON_SOURCES:
        with open(source, encoding='utf-8') as f:
            names.update(re.findall(r'mdi:[a-z0-9-]+', f.read()))
    icons, missing = {}, []
    for name in sorted(names):
        key = 'mdi' + ''.join(part.capitalize() for part in name[4:].split('-'))
        if key in paths:
            icons[name] = paths[key]
        else:
            missing.append(name)
    if missing:
        fail(f'not in @mdi/js {MDI_VERSION}: {", ".join(missing)}')
    return 'export const ICONS = ' + json.dumps(icons) + ';\n'


def scene_names():
    with open(os.path.join(HERE, 'scenes.js'), encoding='utf-8') as f:
        return re.findall(r"^    '([a-z0-9-]+)': \{", f.read(), re.MULTILINE)


def main():
    available = scene_names()
    scenes = sys.argv[1:] or available
    unknown = [name for name in scenes if name not in available]
    if unknown:
        fail(f'unknown scene(s) {", ".join(unknown)}; available: {", ".join(available)}')

    icons = icons_module()
    handler = functools.partial(QuietHandler, directory=ROOT_DIR)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_address[1]}/scripts/screenshots/'

    os.makedirs(OUT_DIR, exist_ok=True)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
            for name in scenes:
                problems = []
                page = browser.new_page(viewport={'width': 1000, 'height': 1200}, device_scale_factor=SCALE)
                page.route('**/scripts/screenshots/icons.js', lambda route: route.fulfill(
                    body=icons, content_type='text/javascript'))
                page.on('console', lambda m: problems.append(f'[{m.type}] {m.text}')
                        if m.type in ('warning', 'error') else None)
                page.on('pageerror', lambda e: problems.append(f'[pageerror] {e}'))

                page.goto(base + 'stand.html?scene=' + name)
                page.wait_for_function('window.waitReady', timeout=10000)
                page.evaluate('window.waitReady()')
                page.evaluate('document.fonts.ready')
                card = page.locator('speakeasy-demo')
                if not card.locator('.panel.open').count():   # remembered state did not open it
                    card.locator('.tools .panel-toggle').click()
                page.wait_for_timeout(800)   # panel transition, first frames

                if problems:
                    fail(f'{name}:\n  ' + '\n  '.join(problems))
                path = os.path.join(OUT_DIR, name + '.jpg')
                page.locator('#stage').screenshot(path=path, type='jpeg', quality=JPEG_QUALITY)
                print(f'Saved {os.path.relpath(path, ROOT_DIR)}')
                page.close()
            browser.close()
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()

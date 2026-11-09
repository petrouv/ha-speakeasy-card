#!/usr/bin/env python3
"""Build the standalone speakeasy-card.js bundle from the src/ and vendor/ modules.

Usage:
    python3 scripts/build.py          # build the bundle
    python3 scripts/build.py --check  # verify the bundle matches src/ and vendor/ (CI)

The build is deliberately primitive: modules are concatenated in SOURCES order,
with only `import ...;` lines and the `export ` prefix of declarations removed.
All card behaviour lives in src/, not here.
"""

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT_DIR, 'speakeasy-card.js')

VENDOR_DIR = os.path.join(ROOT_DIR, 'vendor')
VENDOR_MANIFEST = os.path.join(VENDOR_DIR, 'vendor.json')

# Order matters: dependencies before dependents.
# vendor/ holds unmodified upstream copies (see vendor/vendor.json, scripts/vendor.py).
SOURCES = ['vendor/digital-ptz.js', 'vendor/video-rtc.js', 'src/video-rtc-ext.js', 'src/speakeasy-card.js']

HEADER = """/**
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
"""

IMPORT_RE = re.compile(r'^import\s[^\n]*;[ \t]*\n?', re.MULTILINE)
EXPORT_RE = re.compile(r'^export\s+(?=(?:class|const|let|var|function|async)\b)', re.MULTILINE)
MODULE_SYNTAX_RE = re.compile(r'^\s*(import|export)\b', re.MULTILINE)


def fail(message):
    print(f'ERROR: {message}', file=sys.stderr)
    sys.exit(1)


def strip_module_syntax(name, code):
    code = IMPORT_RE.sub('', code)
    code = EXPORT_RE.sub('', code)
    leftover = MODULE_SYNTAX_RE.search(code)
    if leftover:
        line = code.count('\n', 0, leftover.start()) + 1
        fail(f'{name}:{line}: unsupported module syntax left after stripping')
    return code.rstrip('\n') + '\n'


def check_vendor():
    """Every vendor/ file matches its sha256 in the manifest, i.e. was not edited by hand."""
    with open(VENDOR_MANIFEST, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    for name, entry in manifest.items():
        path = os.path.join(VENDOR_DIR, name)
        if not os.path.isfile(path):
            fail(f'vendored file not found: vendor/{name}; run scripts/vendor.py update {name}')
        with open(path, 'rb') as f:
            digest = hashlib.sha256(f.read()).hexdigest()
        if digest != entry['sha256']:
            fail(
                f'vendor/{name} differs from {entry["repo"]}@{entry["commit"][:7]}; '
                f'do not edit vendored files - run scripts/vendor.py update {name}'
            )


# Upstream code that the overrides in src/video-rtc-ext.js rely on.
# If a snippet is gone after scripts/vendor.py update, upstream changed that spot:
# review the matching override (it may no longer be needed).
UPSTREAM_CONTRACT = {
    'vendor/video-rtc.js': [
        # oninit(): upstream's listener is suppressed via visibilityCheck = false
        "if ('hidden' in document && this.visibilityCheck) {",
        "document.addEventListener('visibilitychange', () => {",
        # connectedCallback(): re-attach is detected by this.video
        'if (this.video) {',
        # disconnectedCallback() is replaced entirely, the timers are the same
        'this.disconnectTID = setTimeout(() => {',
        'this.reconnectTID = setTimeout(() => {',
        # createOffer() is replaced entirely; upstream requests the microphone here
        'async createOffer(pc) {',
        'this.createOffer(pc).then(offer => {',
        # onpcvideo(): when MSE wins, upstream closes the pc and clears this.pc
        'onpcvideo(video2) {',
    ],
}


def check_upstream_contract():
    """The upstream snippets from UPSTREAM_CONTRACT are still present."""
    for name, snippets in UPSTREAM_CONTRACT.items():
        with open(os.path.join(ROOT_DIR, name), 'r', encoding='utf-8') as f:
            code = f.read()
        for snippet in snippets:
            if snippet not in code:
                fail(f'{name} no longer contains {snippet!r}; review src/video-rtc-ext.js overrides')


def build():
    parts = [HEADER]
    for name in SOURCES:
        path = os.path.join(ROOT_DIR, name)
        if not os.path.isfile(path):
            fail(f'source file not found: {path}')
        with open(path, 'r', encoding='utf-8') as f:
            code = f.read()
        parts.append(f'\n// === {os.path.basename(name)} ===\n')
        parts.append(strip_module_syntax(name, code))
    return ''.join(parts)


def verify(bundle):
    """Bundle invariants: our element is registered, the upstream one is not."""
    required = [
        'class VideoRTC extends HTMLElement',
        'class DigitalPTZ',
        'class VideoRTCExt extends VideoRTC',
        'class SpeakeasyCard extends VideoRTCExt',
        "customElements.define('speakeasy-card', SpeakeasyCard);",
    ]
    for snippet in required:
        if snippet not in bundle:
            fail(f'bundle is missing expected code: {snippet!r}')
    forbidden = [
        "customElements.define('webrtc-camera'",  # would clash with the upstream card
        'eval(',
    ]
    for snippet in forbidden:
        if snippet in bundle:
            fail(f'bundle contains forbidden code: {snippet!r}')


def syntax_check(bundle):
    """Syntax check with `node --check` when node is available."""
    node = shutil.which('node')
    if not node:
        print('WARNING: node not found, skipping syntax check')
        return
    with tempfile.NamedTemporaryFile('w', suffix='.js', encoding='utf-8', delete=False) as tmp:
        tmp.write(bundle)
        tmp_path = tmp.name
    try:
        result = subprocess.run([node, '--check', tmp_path], capture_output=True, text=True)
    finally:
        os.unlink(tmp_path)
    if result.returncode != 0:
        fail('syntax check failed:\n' + result.stderr)


def main(argv):
    check_only = '--check' in argv

    check_vendor()
    check_upstream_contract()
    bundle = build()
    verify(bundle)
    syntax_check(bundle)

    if check_only:
        if not os.path.isfile(OUTPUT):
            fail(f'{os.path.relpath(OUTPUT, ROOT_DIR)} does not exist; run scripts/build.py')
        with open(OUTPUT, 'r', encoding='utf-8') as f:
            current = f.read()
        if current != bundle:
            fail(f'{os.path.relpath(OUTPUT, ROOT_DIR)} is out of date; run scripts/build.py and commit the result')
        print('OK: bundle is up to date')
        return

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(bundle)
    print(f'Generated {os.path.relpath(OUTPUT, ROOT_DIR)} ({len(bundle.splitlines())} lines)')


if __name__ == '__main__':
    main(sys.argv[1:])

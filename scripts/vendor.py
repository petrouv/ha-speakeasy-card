#!/usr/bin/env python3
"""Update third-party files in vendor/, pinned in vendor/vendor.json.

Files in vendor/ are unmodified upstream copies at a specific commit.
Do not edit them by hand: scripts/build.py checks their sha256 against the manifest.

Usage:
    python3 scripts/vendor.py update digital-ptz.js            # re-download at the pinned commit
    python3 scripts/vendor.py update digital-ptz.js <commit>   # move to another commit
"""

import argparse
import hashlib
import json
import os
import sys
import urllib.request

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR_DIR = os.path.join(ROOT_DIR, 'vendor')
MANIFEST = os.path.join(VENDOR_DIR, 'vendor.json')
RAW_URL = 'https://raw.githubusercontent.com/{repo}/{commit}/{path}'


def load_manifest():
    """Read the vendor/vendor.json manifest."""
    with open(MANIFEST, 'r', encoding='utf-8') as f:
        return json.load(f)


def sha256(data):
    """Return the hex sha256 of the bytes."""
    return hashlib.sha256(data).hexdigest()


def download(entry):
    """Download the upstream file at the pinned commit."""
    url = RAW_URL.format(**entry)
    with urllib.request.urlopen(url, timeout=30) as resp:
        return resp.read()


def update(name, commit):
    """Re-download file name (optionally at a new commit) and update the manifest."""
    manifest = load_manifest()
    if name not in manifest:
        sys.exit(f'ERROR: {name} not in {os.path.relpath(MANIFEST, ROOT_DIR)}')
    entry = manifest[name]
    if commit:
        entry['commit'] = commit

    data = download(entry)
    with open(os.path.join(VENDOR_DIR, name), 'wb') as f:
        f.write(data)
    entry['sha256'] = sha256(data)

    with open(MANIFEST, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
        f.write('\n')
    print(f'vendor/{name} <- {entry["repo"]}@{entry["commit"][:7]} ({len(data)} bytes)')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    p_update = sub.add_parser('update', help='download a vendored file from upstream')
    p_update.add_argument('name')
    p_update.add_argument('commit', nargs='?')
    args = parser.parse_args()
    update(args.name, args.commit)


if __name__ == '__main__':
    main()

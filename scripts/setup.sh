#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
node --version
npm ci
npm run build

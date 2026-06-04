#!/usr/bin/env bash
set -euo pipefail

# Start backend and frontend development servers (Unix/macOS).
# Usage: ./scripts/start-dev.sh           # assumes deps installed
#        ./scripts/start-dev.sh install   # runs npm install first

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT_DIR/maker-connect"
BACKEND="$FRONTEND/backend"

if [ "${1-}" = "install" ]; then
  echo "Installing dependencies (backend)..."
  (cd "$BACKEND" && npm install)
  echo "Installing dependencies (frontend)..."
  (cd "$FRONTEND" && npm install)
fi

echo "Starting backend (in background)..."
(cd "$BACKEND" && npm run dev) &
BACK_PID=$!

echo "Starting frontend (attached)..."
cd "$FRONTEND" && npm run dev

echo "Frontend exited. Stopping backend (PID $BACK_PID)"
kill $BACK_PID || true

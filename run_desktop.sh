#!/usr/bin/env bash
set -e

# Linux Wayland / Hyprland WebKitGTK hardware acceleration compatibility fix
if [ -z "$WEBKIT_DISABLE_DMABUF_RENDERER" ]; then
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/desktop"

case "$1" in
  web)
    echo "🌐 Starting Aurora Diary Web Preview (http://localhost:1420)..."
    npm run dev
    ;;
  build)
    echo "📦 Building Aurora Diary Desktop Bundle..."
    npm run build
    npx tauri build
    ;;
  dev|"")
    echo "✨ Launching Aurora Diary Desktop App (Wayland/X11)..."
    npx tauri dev
    ;;
  *)
    echo "Usage: $0 [dev|web|build]"
    exit 1
    ;;
esac

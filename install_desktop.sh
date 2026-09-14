#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_SRC="$PROJECT_DIR/desktop/src-tauri/target/release/aurora-diary"
ICON_SRC="$PROJECT_DIR/desktop/src-tauri/icons/128x128.png"

echo "🌌 [Aurora Diary] Installing Desktop Application for Linux..."

# 1. Check if binary is built
if [ ! -f "$BIN_SRC" ]; then
    echo "⚙️ Building Aurora Diary binary..."
    cd "$PROJECT_DIR/desktop"
    npm run build
    cargo build --release --manifest-path "$PROJECT_DIR/desktop/src-tauri/Cargo.toml"
fi

# 2. Setup user bin directory
mkdir -p "$HOME/.local/bin"
cp -f "$BIN_SRC" "$HOME/.local/bin/aurora-diary-desktop"
chmod +x "$HOME/.local/bin/aurora-diary-desktop"
echo "✅ Installed binary to: $HOME/.local/bin/aurora-diary-desktop"

# 3. Setup application icons
ICON_DIR="$HOME/.local/share/icons/hicolor/128x128/apps"
mkdir -p "$ICON_DIR"
cp -f "$ICON_SRC" "$ICON_DIR/aurora-diary.png"
echo "✅ Installed icon to: $ICON_DIR/aurora-diary.png"

# 4. Setup .desktop launcher entry
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"

cat <<EOF > "$DESKTOP_DIR/aurora-diary.desktop"
[Desktop Entry]
Name=Aurora Diary
GenericName=Personal Diary & Journal
Comment=A premium TUI/GUI diary application with Midnight Aurora theme
Exec=$HOME/.local/bin/aurora-diary-desktop
Icon=aurora-diary
Terminal=false
Type=Application
Categories=Utility;Office;
Keywords=diary;journal;aurora;notes;
StartupWMClass=aurora-diary
EOF

chmod +x "$DESKTOP_DIR/aurora-diary.desktop"
echo "✅ Installed desktop entry: $DESKTOP_DIR/aurora-diary.desktop"

# 5. Update desktop database if available
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" || true
fi

echo ""
echo "🎉 Aurora Diary Desktop 설치가 완료되었습니다!"
echo "👉 터미널 실행: aurora-diary-desktop"
echo "👉 시스템 앱 런처(Rofi, Wofi, GNOME, Hyprland Dock 등)에서 'Aurora Diary'를 검색하여 바로 실행할 수 있습니다."

# 🌌 Aurora Diary

> **Midnight Aurora** 테마 기반의 프리미엄 일기장 시스템.  
> 터미널을 사랑하는 개발자를 위한 **TUI / CLI 에디션**과, 미려한 그래픽 및 사진 렌더링을 지원하는 **데스크톱 GUI 에디션(macOS & Linux)**을 모두 제공합니다.

---

## ✨ 주요 에디션 안내

| 기능 구분 | 🖥️ 데스크톱 GUI 에디션 (`desktop/`) | 📟 터미널 TUI 에디션 (`aurora_diary/`) |
| :--- | :--- | :--- |
| **주요 플랫폼** | macOS (Apple Silicon / Intel), Linux | Linux / Unix 터미널 |
| **기술 스택** | Tauri v2 + React 18 + TailwindCSS | Python 3.10+ + Textual + Rich |
| **그래픽 & 미디어** | 실제 고해상도 사진 첨부/확대, 글래스모피즘, 네온 애니메이션, 축하 컨페티 | 그레이스케일 아스키 아트 프리뷰, `$EDITOR` (Vim/Nano) 연동 |
| **동기화** | `~/.config/aurora-diary/diary.json` 공통 로컬 저장소 100% 무손실 공유 |

---

## 🚀 1. 데스크톱 GUI 에디션 사용법

### 1) 리눅스 원클릭 시스템 설치
바이너리와 애플리케이션 메뉴 아이콘을 시스템에 자동 등록합니다:
```bash
chmod +x install_desktop.sh
./install_desktop.sh
```
설치 후 시스템 앱 런처(Rofi, Wofi, GNOME, Hyprland Dock 등)에서 **"Aurora Diary"**를 검색하거나 터미널에서 `aurora-diary-desktop`으로 즉시 실행할 수 있습니다.

### 2) 개발 및 미리보기
```bash
./run_desktop.sh dev   # 독립 데스크톱 윈도우 창 실행 (Wayland / X11 호환)
./run_desktop.sh web   # 웹 브라우저에서 핫 리로딩 UI 프리뷰
./run_desktop.sh build # 최적화 배포 번들 빌드
```

### 3) macOS 데스크톱 설치 파일 (.dmg)
GitHub 원격 레포지토리에 태그(예: `v1.0.0`)를 푸시하면, GitHub Actions CI가 Apple macOS 러너에서 자동으로 최신 `.dmg` 및 `.app` 설치 번들을 빌드하여 Release에 등록합니다.

---

## 📟 2. 터미널 TUI 에디션 사용법

### 1) 설치
```bash
chmod +x install.sh
./install.sh
```

### 2) 실행
```bash
aurora-diary
```

### 3) TUI 모드 단축키
| 단축키 (Key) | 기능 및 역할 |
| :--- | :--- |
| `N` | **신규 일기 작성**: 선택한 날짜에 새로운 일기 작성창(모달)을 띄웁니다. |
| `E` | **일기 편집**: 이미 작성된 일기가 있다면 제목, 기분, 태그 및 본문을 수정합니다. |
| `D` | **일기 삭제**: 현재 선택된 날짜의 일기를 안전하게 즉시 삭제합니다. |
| `F` | **통합 검색**: 실시간 키워드 필터링 모달을 띄워 일기 목록에서 원하는 날짜로 빠르게 이동합니다. |
| `◀` / `▶` | 캘린더 월 이동 |
| `P` | 첨부 이미지를 외부 이미지 뷰어(`xdg-open`)로 띄우기 |
| `Q` | TUI 종료 |

---

## 💻 3. CLI 모드 명령어 (터미널 쉘 파이프라인 친화)

```bash
# 1. 일기 목록 간략 조회 (최근 N개)
aurora-diary -l 5

# 2. 키워드 검색
aurora-diary -s "개발"

# 3. 데이터 백업 / 복원
aurora-diary -e ~/backup.json
aurora-diary -i ~/backup.json
```

---

## 🔒 데이터 보안 및 프라이버시

모든 데이터는 외부 클라우드로 전송되지 않고 오직 로컬 시스템 내에 안전하게 보존됩니다:
- **일기 데이터**: `~/.config/aurora-diary/diary.json`
- **첨부 사진 보관함**: `~/.config/aurora-diary/images/`

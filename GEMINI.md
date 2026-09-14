# GEMINI.md

이 문서는 AI 어시스턴트(Antigravity)와 개발자가 **Aurora Diary** 프로젝트를 구축하고 유지보수할 때 준수해야 하는 모든 기술 스택, 빌드 명령, 가이드라인 및 디자인 약속을 기록합니다.

---

## 🚀 1. 기술 스택 & 개발 환경

Aurora Diary는 **터미널 TUI**와 **모던 데스크톱 GUI (macOS & Linux)** 두 가지 환경을 완벽히 지원하는 하이브리드 일기장 플랫폼입니다.

### 1) 터미널 TUI 에디션 (`aurora_diary/`)
- **주요 언어**: Python 3.10+ (현재 개발 장비 환경: 3.14+)
- **핵심 라이브러리**:
  - `textual` (>=0.85.0): 모던 TUI 컴포넌트, 이벤트 루프, CSS 기반 스타일 시트
  - `rich` (>=13.7.0): 아름다운 텍스트 렌더링, 콘솔 마크다운 파서, ASCII 바 차트
  - `pillow` (>=10.2.0): 로컬 이미지 픽셀 분석 및 터미널 아스키 그레이스케일 렌더러 구현용

### 2) 데스크톱 GUI 에디션 (`desktop/`)
- **셸 & 네이티브 백엔드**: Tauri v2 (`Rust 1.98+`, `tauri`, `tauri-plugin-fs`, `tauri-plugin-dialog`)
- **프론트엔드 프레임워크**: React 18 + TypeScript + Vite
- **스타일링 & 그래픽**: TailwindCSS (Midnight Aurora 커스텀 팔레트), Lucide Icons, Canvas-Confetti
- **렌더러**:
  - macOS: 네이티브 WebKit (극저전력, ~40MB 메모리 점유율)
  - Linux: WebKit2GTK 4.1 (`WEBKIT_DISABLE_DMABUF_RENDERER=1`을 통한 Wayland/Hyprland 호환 패치 내장)

### 3) 공통 데이터 저장소
- **저장 방식**: 로컬 JSON 파일 DB (`~/.config/aurora-diary/diary.json`) 및 첨부 이미지 보관함 (`~/.config/aurora-diary/images/`)
- TUI와 GUI가 동일한 데이터베이스를 공유하여 무손실 양방향 동기화를 보장합니다.

---

## 🛠️ 2. 빌드, 설치 및 실행 스크립트

### 1) 데스크톱 GUI 애플리케이션

#### 개발 모드 실행
```bash
./run_desktop.sh dev   # 독립 데스크톱 윈도우 창 실행 (Wayland/X11 호환)
./run_desktop.sh web   # 브라우저에서 핫 리로딩 UI 프리뷰
```

#### Linux 시스템 전역 설치
```bash
./install_desktop.sh
```
- **수행 동작**:
  1. `desktop/src-tauri`에서 최적화 릴리즈 바이너리를 빌드합니다.
  2. `~/.local/bin/aurora-diary-desktop`에 바이너리를 배치합니다.
  3. `~/.local/share/icons/hicolor/128x128/apps/aurora-diary.png`에 네온 아이콘을 등록합니다.
  4. `~/.local/share/applications/aurora-diary.desktop` XDG 엔트리를 등록하여 시스템 앱 런처(Rofi, Wofi, GNOME, Hyprland Dock 등)에서 바로 실행할 수 있도록 합니다.

### 2) 터미널 TUI 애플리케이션
```bash
# 설치
chmod +x install.sh
./install.sh

# 실행
aurora-diary
```

---

## 🎨 3. Midnight Aurora 디자인 시스템

TUI(`styles.css`)와 GUI(`tailwind.config.js`) 모두 다음 통일된 Midnight Aurora 색상 컨벤션을 엄격히 준수합니다.

| 색상 변수명 | 색상 코드 (TrueColor) | 역할 및 렌더링 의미 |
| :--- | :--- | :--- |
| `$background` | `#0B0F19` | 화면 전체의 메인 깊은 다크 블루 블랙 배경 |
| `$surface` | `#1E293B` | 다이어리 카드, 달력 패널, 다이얼로그 박스의 슬레이트 배경 |
| `$panel-border`| `#334155` / `#475569` | 기본 패널의 테두리 색상 (차분한 Slate) |
| `$neon-cyan` | `#06B6D4` | 활성 탭, 현재 날짜 보더, 일기가 존재하는 날짜의 핵심 하이라이트 |
| `$neon-purple`| `#8B5CF6` | 캘린더 타이틀, 통계 그래픽, 일반 텍스트 강조 |
| `$neon-pink` | `#EC4899` | 경고, 포커스된 액티브 포인터, 감정 최고조 하이라이트 |

### GUI 인터랙션 규칙
- 글래스모피즘(`backdrop-filter: blur(16px)`)과 은은한 오로라 앰비언트 글로우 애니메이션 적용.
- 일기 저장 시 네온 컬러 축하 폭죽(`canvas-confetti`) 연출.
- 한글 가독성을 위해 본문 텍스트는 `weight`를 `regular`(400)로 렌더링.

---

## 📂 4. 데이터 모델 정의 (JSON Schema)

로컬 저장 파일인 `diary.json`은 다음 스키마 구조를 가집니다.

```json
{
  "diaries": {
    "YYYY-MM-DD": {
      "date": "YYYY-MM-DD",
      "title": "일기 제목",
      "content": "마크다운 형식의 본문 내용...",
      "mood": "😊",
      "tags": ["개발", "일상"],
      "image_path": "/absolute/path/to/photo.jpg",
      "updated_at": "2026-05-27T19:32:09Z"
    }
  }
}
```

---

## 🧑‍💻 5. 개발 및 커밋 컨벤션

- **리눅스 Wayland 호환성**: Tauri 구동 시 Wayland/Hyprland의 WebKitGTK DMA-BUF 충돌(`Error 71`)을 방지하기 위해 `WEBKIT_DISABLE_DMABUF_RENDERER=1` 설정을 백엔드 메인 함수와 런처에 필수 유지합니다.
- **커밋 메시지 규칙 (Conventional Commits)**:
  - `feat`: 새로운 기능 추가 (예: `feat: add tauri desktop gui with midnight aurora theme`)
  - `fix`: 버그 수정 (예: `fix: resolve wayland protocol error in webkitgtk`)
  - `docs`: 문서 변경 (예: `docs: update GEMINI.md with desktop architecture`)
  - `style`: 코드 포맷팅, CSS 스타일 시트 수정
  - `refactor`: 프로덕션 코드 리팩토링
  - `chore`: 빌드 업무 수정, 패키지 매니저 설정, .gitignore 수정 등

---

## 🌐 6. Git 저장소 관리 & CI/CD 자동화

- **기본 브랜치**: `main`
- **형상 관리 원칙**:
  - Python 가상환경(`.venv`), Node 의존성(`node_modules`), Rust 빌드 아티팩트(`target`)는 `.gitignore`에 의해 커밋 대상에서 완벽히 제외됩니다.
  - 사용자 로컬 일기 데이터(`~/.config/aurora-diary/`)는 레포지토리 외부에 위치하여 보호됩니다.
- **macOS 자동 빌드 CI**:
  - `.github/workflows/release-macos.yml` 워크플로우를 통해 GitHub 태그 푸시(`v*`) 또는 수동 트리거 시 Apple macOS 최신 러너에서 무중단으로 macOS `.dmg` 설치 파일이 자동 빌드됩니다.

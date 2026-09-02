# GEMINI.md

이 문서는 AI 어시스턴트(Antigravity)와 개발자가 **Aurora Diary** 프로젝트를 구축하고 유지보수할 때 준수해야 하는 모든 기술 스택, 빌드 명령, 가이드라인 및 디자인 약속을 기록합니다.

---

## 🚀 1. 기술 스택 & 개발 환경

- **주요 언어**: Python 3.14+ (현재 개발 장비 환경 적용)
- **핵심 라이브러리**:
  - `textual` (>=0.85.0): 모던 TUI 컴포넌트, 이벤트 루프, CSS 기반 스타일 시트
  - `rich` (>=13.7.0): 아름다운 텍스트 렌더링, 콘솔 마크다운 파서, ASCII 바 차트
  - `pillow` (>=10.2.0): 로컬 이미지 픽셀 분석 및 터미널 아스키 그레이스케일 렌더러 구현용
- **데이터 저장 방식**: 로컬 JSON 파일 DB (`~/.config/aurora-diary/diary.json`)

---

## 🛠️ 2. 빌드, 설치 및 실행 스크립트

개발 및 배포 프로세스를 간소화하기 위해 원클릭 자동 설치 스크립트(`install.sh`)를 제공합니다.

### 설치 방법
```bash
chmod +x install.sh
./install.sh
```
- **수행 동작**:
  1. 프로젝트 디렉토리 내에 가상환경(`.venv`)을 생성합니다.
  2. `pip install -e .` 명령어를 통해 `pyproject.toml`의 의존성을 설치하고 패키지를 편집 가능(Editable) 모드로 링크합니다.
  3. `~/.local/bin/aurora-diary`에 가상환경 내부의 바이너리를 실행하는 래퍼 스크립트를 심볼릭 링크 또는 래퍼 실행 스크립트로 자동 등록합니다.

### 실행 방법
설치 후 사용자는 터미널 내 어느 위치에서나 아래 명령어로 일기장을 호출할 수 있습니다.
```bash
aurora-diary
```

---

## 🎨 3. Midnight Aurora TUI 디자인 시스템

Textual의 CSS 프레임워크를 활용하여 터미널 내에서 프리미엄 오로라 룩을 구현합니다. `styles.css` 작성 시 다음 색상 컨벤션을 엄격히 준수합니다.

| 색상 변수명 | 색상 코드 (TrueColor) | 역할 및 렌더링 의미 |
| :--- | :--- | :--- |
| `$background` | `#0B0F19` | 터미널 화면 전체의 메인 깊은 다크 블루 블랙 배경 |
| `$surface` | `#1E293B` | 다이어리 카드, 달력 패널, 다이얼로그 박스의 슬레이트 배경 |
| `$panel-border` | `#475569` | 기본 패널의 테두리 색상 (차분한 Slate-600) |
| `$neon-cyan` | `#06B6D4` | 활성 탭, 현재 날짜 보더, 일기가 존재하는 날짜의 핵심 하이라이트 |
| `$neon-purple` | `#8B5CF6` | 캘린더 타이틀, 통계 그래픽, 일반 텍스트 강조 |
| `$neon-pink` | `#EC4899` | 경고, 포커스된 액티브 포인터, 감정 최고조 하이라이트 |

### UI 상호작용 규칙 (Interactive Micro-animations)
- 버튼 및 입력 필드 포커스 시 보더 컬러가 `$panel-border`에서 `$neon-pink` 또는 `$neon-cyan`으로 부드럽게 전이되어야 합니다.
- 캘린더 날짜 클릭 시 해당 날짜의 일기가 우측 패널에 마크다운 양식으로 자연스럽게 렌더링되어야 합니다.

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

- **코드 퀄리티**: 리눅스 전문가용 도구에 걸맞게 예외 처리를 최우선으로 합니다. (예: 이미지 파일이 손상되었거나 경로가 부재할 시 크래시 없이 '이미지 없음' 가이드 표기)
- **에디터 샌드박싱**: 외부 에디터(Vim 등) 구동 시 Textual의 TUI 루프를 일시 중지(`suspend_context` 사용)하고 안전하게 서브프로세스를 가동한 뒤, 복귀 시 TUI를 리프레시해야 합니다.
- **커밋 메시지 규칙 (Conventional Commits)**:
  - `feat`: 새로운 기능 추가 (예: `feat: add markdown image export feature`)
  - `fix`: 버그 수정 (예: `fix: handle missing diary.json gracefully`)
  - `docs`: 문서 변경 (예: `docs: update GEMINI.md and README`)
  - `style`: 코드 포맷팅, CSS 스타일 시트 수정 (예: `style: update midnight aurora neon glow palette`)
  - `refactor`: 프로덕션 코드 리팩토링
  - `chore`: 빌드 업무 수정, 패키지 매니저 설정, .gitignore 수정 등

---

## 🌐 6. Git 저장소 관리 & GitHub 동기화 가이드

- **기본 브랜치**: `main`
- **형상 관리 원칙**:
  - 가상환경(`.venv`), 바이트코드(`__pycache__`, `*.pyc`), 빌드 아티팩트(`*.egg-info`)는 `.gitignore`에 의해 반드시 커밋 대상에서 제외됩니다.
  - 사용자 로컬 다이어리 데이터(`~/.config/aurora-diary/diary.json`)는 레포지토리 외부 격리 디렉토리에 위치하여 Git에 노출되지 않습니다.
- **GitHub 원격 저장소 푸시 절차**:
  ```bash
  # 1. 원격 저장소 등록
  git remote add origin https://github.com/kimjiho680629/<repo_name>.git
  
  # 2. 메인 브랜치 푸시
  git push -u origin main
  ```

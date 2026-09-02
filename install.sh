#!/bin/bash

# 에러 발생 시 즉시 중단
set -e

# 프로젝트 디렉토리 경로 획득
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "\e[1;36m=== Aurora Diary TUI 설치를 시작합니다 ===\e[0m"

# 1. 파이썬 가상환경 생성
echo -e "\n\e[1;34m[1/3] 파이썬 가상환경(.venv) 구성 중...\e[0m"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo ".venv 가상환경이 성공적으로 생성되었습니다."
else
    echo ".venv 가상환경이 이미 존재합니다. 스킵합니다."
fi

# 2. 가상환경 내 의존성 패키지 설치
echo -e "\n\e[1;34m[2/3] 필수 의존성 패키지 설치 중 (Textual, Rich, Pillow)...\e[0m"
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -e .

# 3. 사용자 실행 래퍼 등록 (~/.local/bin/aurora-diary)
echo -e "\n\e[1;34m[3/3] 글로벌 CLI 명령어 래퍼 등록 중...\e[0m"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

WRAPPER_PATH="$BIN_DIR/aurora-diary"

# 래퍼 스크립트 작성
cat << EOF > "$WRAPPER_PATH"
#!/bin/bash
# Aurora Diary TUI 실행 래퍼 스크립트
export PATH="$PROJECT_DIR/.venv/bin:\$PATH"
exec "$PROJECT_DIR/.venv/bin/aurora-diary" "\$@"
EOF

chmod +x "$WRAPPER_PATH"

echo -e "\n\e[1;32m=== 설치가 완료되었습니다! ===\e[0m"
echo -e "이제 터미널에 \e[1;33maurora-diary\e[0m 를 입력하여 프리미엄 일기장을 실행하실 수 있습니다."
echo -e "※ 만약 명령어를 찾을 수 없다면, \e[1;35m~/.local/bin\e[0m 경로가 PATH 환경 변수에 포함되어 있는지 확인해 주세요."
echo -e "   (보통 ~/.bashrc 또는 ~/.zshrc 에 export PATH=\"\$HOME/.local/bin:\$PATH\" 를 추가하시면 됩니다.)\n"

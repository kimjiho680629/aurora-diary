import os
import tempfile
import subprocess
from typing import Optional
from PIL import Image

def run_external_editor(initial_content: str = "") -> Optional[str]:
    """시스템 환경변수 $EDITOR (또는 vim, nano)를 활용하여 임시 마크다운 파일을 열고
    사용자가 편집한 텍스트 내용을 반환합니다. 에러나 취소 시 None을 반환합니다.
    """
    # 1. 실행할 에디터 결정
    editor = os.environ.get("EDITOR")
    if not editor:
        # 우선순위: vim -> nano -> vi
        for fallback in ["vim", "nano", "vi"]:
            if subprocess.run(["which", fallback], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
                editor = fallback
                break
        if not editor:
            editor = "nano"  # 최후의 수단

    # 2. 임시 파일 생성 및 초기 내용 쓰기
    try:
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w", encoding="utf-8") as temp_file:
            temp_file.write(initial_content)
            temp_file_path = temp_file.name

        # 3. 서브프로세스를 통해 에디터 실행 (터미널 제어권을 서브프로세스에게 완전히 이관)
        # Textual TUI 앱 내부에서 이 메서드를 호출할 때 TUI를 잠시 일시정지(suspend)해야 합니다.
        result = subprocess.run([editor, temp_file_path])

        if result.returncode == 0:
            # 4. 사용자가 저장한 내용 읽기
            with open(temp_file_path, "r", encoding="utf-8") as f:
                edited_content = f.read()
            return edited_content
        return None
    except Exception as e:
        # 전문가급 오류 방어: 예외 발생 시 로그나 터미널 크래시 없이 안정적 예외 처리
        return None
    finally:
        # 5. 생성한 임시 파일 확실하게 소거
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass

def image_to_ascii(image_path: str, cols: int = 50, rows_scale: float = 0.45) -> str:
    """로컬 이미지 파일을 읽어 지정된 글자 가로 폭(cols)에 맞는
    그레이스케일 기반 아스키 아트 문자열로 렌더링합니다.
    
    Args:
        image_path: 로컬 이미지 절대/상대 경로
        cols: 아스키 아트를 그릴 가로 문자 칸 수
        rows_scale: 터미널 폰트 세로/가로 비율 조정 계수 (기본값 0.45)
    """
    if not image_path or not os.path.exists(image_path):
        return "[!] 이미지가 존재하지 않거나 경로가 잘못되었습니다."

    # 아스키 픽셀 강도 매핑 테이블 (어두운 곳 -> 밝은 곳)
    # 터미널 다크 모드 배경 기준
    ASCII_CHARS = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. "
    
    try:
        with Image.open(image_path) as img:
            # 1. 그레이스케일(L) 모드로 변환
            img = img.convert("L")
            
            # 2. 비율 계산 후 리사이징
            orig_width, orig_height = img.size
            aspect_ratio = orig_height / orig_width
            
            # 터미널 글자는 세로가 가로보다 길기 때문에 rows_scale 곱하여 보정
            new_width = cols
            new_height = int(cols * aspect_ratio * rows_scale)
            
            # 너무 얇게 찌그러지는 현상 방지
            if new_height < 3:
                new_height = 3
                
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 3. 픽셀 값을 아스키 문자로 매핑
            pixels = img.getdata()
            ascii_str = []
            
            # 명도 단계별 문자 매핑 계산식
            num_chars = len(ASCII_CHARS)
            for pixel_val in pixels:
                # 0~255 값을 아스키 인덱스로 매핑
                idx = int((pixel_val / 255.0) * (num_chars - 1))
                ascii_str.append(ASCII_CHARS[idx])
                
            # 4. 가로 cols 폭으로 잘라 여러 줄 스트링으로 결합
            ascii_lines = []
            for i in range(0, len(ascii_str), new_width):
                ascii_lines.append("".join(ascii_str[i:i + new_width]))
                
            return "\n".join(ascii_lines)
            
    except Exception as e:
        return f"[!] 이미지 디코딩/리사이즈 실패: {str(e)}"

def open_image_external(image_path: str):
    """리눅스 데스크톱 환경의 xdg-open을 실행하여 첨부된 이미지를 외부 뷰어로 띄웁니다."""
    if not image_path or not os.path.exists(image_path):
        return False
    try:
        # 백그라운드로 안전하게 실행
        subprocess.Popen(["xdg-open", image_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        # xdg-open이 실패할 경우 (CLI 전용 헤드리스 서버 등) 대비 오류 억제
        return False

import os
import json
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

DEFAULT_STORAGE_DIR = os.environ.get("AURORA_DIARY_DIR", os.path.expanduser("~/.config/aurora-diary"))
DEFAULT_STORAGE_FILE = os.path.join(DEFAULT_STORAGE_DIR, "diary.json")

class DiaryStorage:
    def __init__(self, file_path: str = DEFAULT_STORAGE_FILE):
        self.file_path = file_path
        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        """저장 디렉토리 및 JSON 파일이 부재할 시 기본 구조로 자동 생성합니다."""
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        if not os.path.exists(self.file_path):
            self._write_raw_data({"diaries": {}})

    def _read_raw_data(self) -> Dict[str, Any]:
        """로컬 JSON 파일을 안전하게 로드합니다. 파일이 깨진 경우 복구 백업 후 초기화합니다."""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            # 안전망: 손상된 파일 발견 시 .bak로 백업 후 신규 초기화
            if os.path.exists(self.file_path):
                backup_path = self.file_path + ".corrupted.bak"
                shutil.copy2(self.file_path, backup_path)
            empty_structure = {"diaries": {}}
            self._write_raw_data(empty_structure)
            return empty_structure

    def _write_raw_data(self, data: Dict[str, Any]):
        """로컬 JSON 파일에 데이터를 안전하게 기록합니다."""
        # 디렉토리가 중간에 지워졌을 상황 대비 안전 장치
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def save_entry(self, date_str: str, title: str, content: str, mood: str, tags: List[str], image_path: Optional[str] = None) -> Dict[str, Any]:
        """일기 항목을 신규 생성하거나 업데이트합니다.
        
        Args:
            date_str: 'YYYY-MM-DD' 형태의 날짜 스트링
            title: 제목
            content: 본문 마크다운 내용
            mood: 감정 이모지 (🤩, 😊, 😐, 😢, 😡)
            tags: 태그 문자열 리스트
            image_path: 로컬 이미지 파일 경로 (옵션)
        """
        data = self._read_raw_data()
        
        # 태그 공백 제거 및 중복 제거
        processed_tags = list(set([t.strip() for t in tags if t.strip()]))
        
        entry = {
            "date": date_str,
            "title": title.strip() or f"{date_str}의 일기",
            "content": content,
            "mood": mood or "😐",
            "tags": processed_tags,
            "image_path": image_path.strip() if image_path and image_path.strip() else None,
            "updated_at": datetime.now().isoformat()
        }
        
        data["diaries"][date_str] = entry
        self._write_raw_data(data)
        return entry

    def get_entry(self, date_str: str) -> Optional[Dict[str, Any]]:
        """지정한 날짜('YYYY-MM-DD')의 일기를 획득합니다. 없으면 None을 리턴합니다."""
        data = self._read_raw_data()
        return data["diaries"].get(date_str)

    def delete_entry(self, date_str: str) -> bool:
        """지정한 날짜의 일기를 삭제합니다. 삭제 성공 여부를 반환합니다."""
        data = self._read_raw_data()
        if date_str in data["diaries"]:
            del data["diaries"][date_str]
            self._write_raw_data(data)
            return True
        return False

    def get_all_entries(self) -> List[Dict[str, Any]]:
        """등록된 모든 일기를 날짜 역순(최신순)으로 정렬하여 반환합니다."""
        data = self._read_raw_data()
        entries = list(data["diaries"].values())
        entries.sort(key=lambda x: x["date"], reverse=True)
        return entries

    def get_entries_in_month(self, year: int, month: int) -> Dict[str, Dict[str, Any]]:
        """지정한 연/월에 해당하는 일기 목록을 날짜를 키로 하는 딕셔너리로 반환합니다.
        캘린더 렌더링에 적합하도록 최적화되어 있습니다."""
        data = self._read_raw_data()
        prefix = f"{year:04d}-{month:02d}-"
        result = {}
        for k, v in data["diaries"].items():
            if k.startswith(prefix):
                result[k] = v
        return result

    def search_entries(self, query: str = "", tag: str = "", mood: str = "") -> List[Dict[str, Any]]:
        """지정된 키워드, 태그 및 기분으로 일기를 통합 검색 필터링하여 최신순으로 정렬 후 반환합니다.
        
        Args:
            query: 제목 또는 본문에서 매칭할 검색 키워드 (대소문자 무시)
            tag: 필터링할 태그명 (정확히 매칭)
            mood: 필터링할 기분 이모지
        """
        entries = self.get_all_entries()
        filtered = []
        
        query = query.lower().strip()
        tag = tag.strip()
        mood = mood.strip()
        
        for entry in entries:
            # 1. 기분 필터 검사
            if mood and entry.get("mood") != mood:
                continue
                
            # 2. 태그 필터 검사
            if tag and tag not in entry.get("tags", []):
                continue
                
            # 3. 키워드 쿼리 검사
            if query:
                title_match = query in entry.get("title", "").lower()
                content_match = query in entry.get("content", "").lower()
                tag_match = any(query in t.lower() for t in entry.get("tags", []))
                
                if not (title_match or content_match or tag_match):
                    continue
            
            filtered.append(entry)
            
        return filtered

    def get_mood_stats(self, days: int = 30) -> List[Tuple[str, int, float]]:
        """최근 N일 동안의 감정 빈도 분포 및 점유율(%)을 집계하여 최신순으로 반환합니다.
        
        Returns:
            [(감정_이모지, 빈도수, 백분율_비율)] 리스트
        """
        entries = self.get_all_entries()[:days]
        total_count = len(entries)
        
        stats = {
            "🤩": 0,
            "😊": 0,
            "😐": 0,
            "😢": 0,
            "😡": 0
        }
        
        for entry in entries:
            m = entry.get("mood", "😐")
            if m in stats:
                stats[m] += 1
            else:
                stats["😐"] += 1
                
        result = []
        for mood, count in stats.items():
            percentage = (count / total_count * 100) if total_count > 0 else 0.0
            result.append((mood, count, percentage))
            
        return result

    def get_all_tags(self) -> List[str]:
        """등록된 모든 일기에서 쓰인 태그 유니크 목록을 정렬하여 반환합니다."""
        entries = self.get_all_entries()
        tags_set = set()
        for entry in entries:
            for t in entry.get("tags", []):
                tags_set.add(t)
        return sorted(list(tags_set))

    def export_db(self, dest_path: str) -> bool:
        """현재 일기장 데이터베이스(JSON 파일 전체)를 지정된 외부 경로로 안전하게 내보냅니다."""
        try:
            dest_dir = os.path.dirname(os.path.abspath(dest_path))
            if dest_dir:
                os.makedirs(dest_dir, exist_ok=True)
            shutil.copy2(self.file_path, dest_path)
            return True
        except IOError:
            return False

    def import_db(self, src_path: str) -> bool:
        """외부에 백업된 일기장 JSON 파일을 현재 저장소로 가져와 덮어씌웁니다."""
        try:
            if not os.path.exists(src_path):
                return False
            # 정합성 체크: 가져올 파일이 유효한 JSON 스키마를 가졌는지 간략 검사
            with open(src_path, "r", encoding="utf-8") as f:
                temp_data = json.load(f)
                if not isinstance(temp_data, dict) or "diaries" not in temp_data:
                    return False
            
            # 정합성 검증 완료 시 복사 덮어쓰기
            shutil.copy2(src_path, self.file_path)
            return True
        except (IOError, json.JSONDecodeError):
            return False

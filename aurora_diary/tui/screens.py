from datetime import date
from typing import Dict, Any, List, Optional
from textual.app import ComposeResult
from textual.screen import ModalScreen
from textual.widget import Widget
from textual.widgets import Static, Button, Input, Label, ListView, ListItem
from textual.containers import Vertical, Horizontal

from aurora_diary.utils import run_external_editor, image_to_ascii

class WriteScreen(ModalScreen[Optional[Dict[str, Any]]]):
    """일기를 신규 작성하거나 기존 일기를 수정하기 위한 모달 스크린"""

    def __init__(self, storage: Any, target_date: date, existing_entry: Optional[Dict[str, Any]] = None, **kwargs):
        super().__init__(**kwargs)
        self.storage = storage
        self.target_date = target_date
        self.existing_entry = existing_entry
        
        # 수정 모드 시 기존 정보 바인딩
        self.temp_content = existing_entry.get("content", "") if existing_entry else ""
        self.selected_mood = existing_entry.get("mood", "😐") if existing_entry else "😐"
        self.initial_title = existing_entry.get("title", "") if existing_entry else ""
        self.initial_tags = ", ".join(existing_entry.get("tags", [])) if existing_entry else ""
        self.initial_img = existing_entry.get("image_path", "") if existing_entry else ""

    def compose(self) -> ComposeResult:
        title_action = "수정" if self.existing_entry else "작성"
        
        with Vertical(classes="dialog-container"):
            yield Label(f"✍️ {self.target_date.isoformat()} 일기 {title_action}", classes="dialog-title")
            
            # 제목 입력
            yield Label("제목", classes="write-field-title")
            yield Input(placeholder="오늘 하루의 요약 제목", value=self.initial_title, id="write-title")
            
            # 감정 기분 선택 (5단계 버튼 배치)
            yield Label("오늘의 기분", classes="write-field-title")
            with Horizontal(classes="write-mood-container"):
                yield Button("🤩 아주좋음", id="mood-btn-great", variant="default")
                yield Button("😊 좋음", id="mood-btn-good", variant="default")
                yield Button("😐 보통", id="mood-btn-neutral", variant="primary")
                yield Button("😢 슬픔", id="mood-btn-sad", variant="default")
                yield Button("😡 화남", id="mood-btn-angry", variant="default")
                
            # 태그 입력
            yield Label("태그 (쉼표로 구분)", classes="write-field-title")
            yield Input(placeholder="예: 개발, 일상, 운동", value=self.initial_tags, id="write-tags")
            
            # 이미지 첨부 경로 입력
            yield Label("이미지 첨부 (선택 - 로컬 절대 경로)", classes="write-field-title")
            yield Input(placeholder="예: /home/user/pictures/today.png", value=self.initial_img, id="write-image")
            
            # 본문 마크다운 작성을 위한 외부 에디터 구동 버튼
            yield Label("일기 본문", classes="write-field-title")
            self.editor_status = Label(
                "본문 미작성 (에디터를 열어 작성해 주세요.)" if not self.temp_content else "본문 작성 완료 (수정 가능)",
                classes="help-text"
            )
            yield self.editor_status
            yield Button("💻 Vim/Nano 에디터 실행", id="btn-run-editor", classes="write-editor-btn")
            
            # 최종 액션 버튼들
            with Horizontal(classes="write-action-container"):
                yield Button("💾 저장", id="btn-save", variant="success", classes="write-save-btn")
                yield Button("❌ 취소", id="btn-cancel", variant="error")

    def on_mount(self) -> None:
        """이동 시 저장해둔 기분에 맞는 버튼 상태 하이라이트"""
        self._highlight_mood_button(self.selected_mood)

    def _highlight_mood_button(self, mood_emoji: str):
        """선택된 감정 기분의 버튼 스타일을 하이라이팅 처리하고 나머지는 일반화합니다."""
        mood_map = {
            "great": "🤩 아주좋음",
            "good": "😊 좋음",
            "neutral": "😐 보통",
            "sad": "😢 슬픔",
            "angry": "😡 화남"
        }
        
        # 실제 내부 기분 이모지 매핑
        emoji_to_key = {
            "🤩": "great",
            "😊": "good",
            "😐": "neutral",
            "😢": "sad",
            "😡": "angry"
        }
        
        selected_key = emoji_to_key.get(mood_emoji, "neutral")
        self.selected_mood = mood_emoji
        
        for key, label in mood_map.items():
            btn = self.query_one(f"#mood-btn-{key}", Button)
            if key == selected_key:
                btn.variant = "success"
                btn.styles.background = "#06B6D4"
                btn.styles.color = "#0B0F19"
            else:
                btn.variant = "default"
                btn.styles.background = "#1E293B"
                btn.styles.color = "#F8FAFC"

    def on_button_pressed(self, event: Button.Pressed) -> None:
        btn_id = event.button.id
        
        # 감정 버튼 감지
        if btn_id.startswith("mood-btn-"):
            mood_emoji_map = {
                "great": "🤩",
                "good": "😊",
                "neutral": "😐",
                "sad": "😢",
                "angry": "😡"
            }
            key = btn_id.split("-")[-1]
            self._highlight_mood_button(mood_emoji_map[key])
            
        # 에디터 구동 버튼 감지
        elif btn_id == "btn-run-editor":
            # Textual suspend 안전망: TUI 렌더러를 일시 중지하고 서브프로세스 기동
            with self.app.suspend():
                content = run_external_editor(self.temp_content)
                
            if content is not None:
                self.temp_content = content
                self.editor_status.update("본문 작성 완료 (수정 가능)")
                self.editor_status.styles.color = "#06B6D4"
                
        # 저장 버튼 감지
        elif btn_id == "btn-save":
            title = self.query_one("#write-title", Input).value
            tags_str = self.query_one("#write-tags", Input).value
            image_path = self.query_one("#write-image", Input).value
            
            # 쉼표 구분 태그 처리
            tags = [t.strip() for t in tags_str.split(",") if t.strip()]
            
            # 스토리지 저장 후 모달 결과 반환
            saved_entry = self.storage.save_entry(
                date_str=self.target_date.isoformat(),
                title=title,
                content=self.temp_content,
                mood=self.selected_mood,
                tags=tags,
                image_path=image_path
            )
            self.dismiss(saved_entry)
            
        # 취소 버튼 감지
        elif btn_id == "btn-cancel":
            self.dismiss(None)


class SearchScreen(ModalScreen[Optional[date]]):
    """키워드/태그를 활용해 작성된 일기를 실시간 필터링 검색하는 대화형 스크린"""

    def __init__(self, storage: Any, **kwargs):
        super().__init__(**kwargs)
        self.storage = storage
        self.search_results: List[Dict[str, Any]] = []

    def compose(self) -> ComposeResult:
        with Vertical(classes="dialog-container search-dialog"):
            yield Label("🔍 일기 통합 검색 및 검색", classes="dialog-title")
            
            yield Input(placeholder="검색할 제목, 본문 키워드 입력...", id="search-input")
            
            yield Label("검색 결과 목록 (선택 시 해당 일기 날짜로 이동):", classes="search-result-label")
            
            # 스크롤 가능한 검색 결과 리스트 뷰
            self.results_list = ListView(id="search-results-list")
            yield self.results_list
            
            with Horizontal(classes="search-action-container"):
                yield Button("닫기", id="btn-search-close", variant="primary")

    def on_mount(self) -> None:
        self.update_results()
        self.query_one("#search-input", Input).focus()

    def update_results(self, query: str = ""):
        """Storage를 조회하여 매칭되는 결과를 리스트 위젯에 빌드합니다."""
        self.search_results = self.storage.search_entries(query=query)
        self.results_list.clear()
        
        if not self.search_results:
            self.results_list.append(ListItem(Static("매칭되는 일기가 존재하지 않습니다.", classes="search-empty-text")))
            return
            
        for entry in self.search_results:
            d_str = entry["date"]
            mood = entry.get("mood", "😐")
            title = entry.get("title", "")
            tags = ", ".join(entry.get("tags", []))
            tag_display = f" [{tags}]" if tags else ""
            
            item_text = f"{d_str} {mood}  {title}{tag_display}"
            li = ListItem(Static(item_text))
            li.date_value = date.fromisoformat(d_str)
            self.results_list.append(li)

    def on_input_changed(self, event: Input.Changed) -> None:
        """키 입력 시 실시간으로 검색 필터링을 수행합니다."""
        if event.input.id == "search-input":
            self.update_results(event.value)

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        """리스트 아이템 선택 시 해당 날짜를 들고 모달을 닫습니다."""
        selected_item = event.item
        if hasattr(selected_item, "date_value"):
            self.dismiss(selected_item.date_value)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-search-close":
            self.dismiss(None)

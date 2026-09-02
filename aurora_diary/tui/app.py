from datetime import date, datetime
from typing import Dict, Any, Optional
from textual.app import App, ComposeResult
from textual.containers import Vertical, Horizontal
from textual.widgets import Header, Footer, Static, Label
from textual.reactive import reactive
from rich.markdown import Markdown

from aurora_diary.storage import DiaryStorage
from aurora_diary.tui.widgets import CalendarWidget, StatsWidget
from aurora_diary.tui.screens import WriteScreen, SearchScreen
from aurora_diary.utils import image_to_ascii, open_image_external

class AuroraDiaryApp(App):
    """Midnight Aurora TUI 프리미엄 일기장 메인 애플리케이션"""
    
    CSS_PATH = "styles.css"
    TITLE = "🌌 Aurora Diary - Midnight Aurora"
    
    # 단축키 설정
    BINDINGS = [
        ("n", "new_entry", "✍️ 신규 일기"),
        ("e", "edit_entry", "✏️ 일기 수정"),
        ("d", "delete_entry", "🗑️ 일기 삭제"),
        ("f", "search", "🔍 통합 검색"),
        ("left", "prev_month", "◀ 이전 달"),
        ("right", "next_month", "▶ 다음 달"),
        ("p", "open_image", "🖼️ 이미지 외부 열기"),
        ("q", "quit", "❌ 종료"),
    ]

    selected_date = reactive(date.today())

    def __init__(self, storage: DiaryStorage, **kwargs):
        super().__init__(**kwargs)
        self.storage = storage
        self.current_entry: Optional[Dict[str, Any]] = None

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        
        with Horizontal(id="app-grid"):
            # 1. 좌측 사이드바 패널
            with Vertical(id="sidebar-panel"):
                self.calendar = CalendarWidget(self.storage, initial_date=self.selected_date)
                yield self.calendar
                
                self.stats = StatsWidget(self.storage, days=30)
                yield self.stats
                
            # 2. 우측 내용 상세 뷰어 패널
            with Vertical(id="content-panel"):
                # 메인 상세 보기 카드
                with Vertical(classes="aurora-card", id="diary-main-card"):
                    self.display_title = Label("일기장 로드 중...", id="diary-display-title")
                    yield self.display_title
                    
                    self.display_meta = Label("", id="diary-display-meta")
                    yield self.display_meta
                    
                    self.display_body = Static("", id="diary-display-body")
                    yield self.display_body
                    
                    # 첨부 이미지 아스키 아트 렌더링 컨테이너
                    self.image_preview = Static(
                        "첨부된 이미지가 없습니다.", 
                        id="diary-image-preview"
                    )
                    self.image_preview.border_title = "🖼️ 첨부 이미지 아스키 프리뷰 (열려면 [P] 키)"
                    yield self.image_preview
                    
        yield Footer()

    def on_mount(self) -> None:
        """앱이 구동되면 오늘 날짜의 일기를 로드하고 화면 포커스를 잡습니다."""
        self.calendar.focus()
        self.load_diary_for_date(self.selected_date)

    def load_diary_for_date(self, target_date: date):
        """특정 날짜의 일기 데이터를 로드하여 화면에 렌더링합니다."""
        self.selected_date = target_date
        entry = self.storage.get_entry(target_date.isoformat())
        self.current_entry = entry
        
        date_str = target_date.strftime("%Y년 %m월 %d일 (%A)")
        
        if entry:
            # 일기 데이터 존재 시
            title = entry.get("title", f"{target_date.isoformat()}의 일기")
            mood = entry.get("mood", "😐")
            tags = entry.get("tags", [])
            content = entry.get("content", "")
            img_path = entry.get("image_path", "")
            updated_at = entry.get("updated_at", "")
            
            # 메타데이터 영역 빌드
            tag_str = " ".join([f"#{t}" for t in tags]) if tags else "태그 없음"
            meta_text = f"오늘의 기분: {mood}   |   태그: {tag_str}\n최종 수정: {updated_at[:19].replace('T', ' ')}"
            
            # 본문 마크다운 파싱 및 렌더링
            body_markdown = Markdown(content) if content.strip() else Markdown("*작성된 본문 내용이 없습니다.*")
            
            # UI 컴포넌트 업데이트
            self.display_title.update(f"🌌 {title}")
            self.display_meta.update(meta_text)
            self.display_body.update(body_markdown)
            
            # 이미지 렌더링
            if img_path:
                ascii_art = image_to_ascii(img_path, cols=60)
                self.image_preview.update(ascii_art)
                self.image_preview.styles.display = "block"
            else:
                self.image_preview.update("첨부된 이미지가 없습니다.")
                self.image_preview.styles.display = "block"
        else:
            # 일기 데이터 미존재 시 (작성 권장 안내)
            self.display_title.update(f"🌌 {date_str}")
            self.display_meta.update("기록이 없는 날입니다.")
            
            guide_md = Markdown(
                "## 오늘 하루는 어떠셨나요? 📝\n\n"
                "아직 작성된 일기가 존재하지 않습니다.\n"
                "**[N]** 키를 누르거나 마우스로 더블클릭하여 오늘의 소중한 기록을 채워보세요!"
            )
            self.display_body.update(guide_md)
            self.image_preview.update("일기를 작성하고 아름다운 오로라 감성을 채워보세요. ✨")

    def on_calendar_widget_date_selected(self, message: CalendarWidget.DateSelected) -> None:
        """달력에서 날짜 클릭 시 연동하여 상세 뷰 갱신"""
        self.load_diary_for_date(message.selected_date)

    def action_new_entry(self) -> None:
        """신규 작성 스크린을 띄웁니다."""
        # 해당 날짜에 기존 일기가 있는지 검사
        existing = self.storage.get_entry(self.selected_date.isoformat())
        self.push_screen(
            WriteScreen(self.storage, self.selected_date, existing_entry=existing),
            callback=self._handle_write_complete
        )

    def action_edit_entry(self) -> None:
        """기존 일기가 있으면 수정 스크린을 호출합니다."""
        existing = self.storage.get_entry(self.selected_date.isoformat())
        if not existing:
            # 일기가 없으면 신규 작성으로 자연스럽게 라우팅
            self.action_new_entry()
            return
            
        self.push_screen(
            WriteScreen(self.storage, self.selected_date, existing_entry=existing),
            callback=self._handle_write_complete
        )

    def _handle_write_complete(self, result: Optional[Dict[str, Any]]) -> None:
        """작성이 성공적으로 완료되면 컴포넌트들을 전체 리프레시합니다."""
        if result:
            # 달력, 통계, 다이어리 본문 전면 동기화 리프레시
            self.calendar.update_selected_date(self.selected_date)
            self.stats.refresh_stats()
            self.load_diary_for_date(self.selected_date)
            self.notify("일기가 성공적으로 저장되었습니다! 🌌", title="저장 성공", severity="information")

    def action_delete_entry(self) -> None:
        """현재 일기를 즉시 안전하게 삭제합니다."""
        if not self.current_entry:
            self.notify("삭제할 일기가 없습니다.", title="알림", severity="warning")
            return
            
        success = self.storage.delete_entry(self.selected_date.isoformat())
        if success:
            self.calendar.update_selected_date(self.selected_date)
            self.stats.refresh_stats()
            self.load_diary_for_date(self.selected_date)
            self.notify("일기가 삭제되었습니다.", title="삭제 완료", severity="information")
        else:
            self.notify("삭제 처리 중 알 수 없는 에러가 발생했습니다.", title="삭제 실패", severity="error")

    def action_search(self) -> None:
        """통합 검색 모달을 띄웁니다."""
        self.push_screen(
            SearchScreen(self.storage),
            callback=self._handle_search_complete
        )

    def _handle_search_complete(self, target_date: Optional[date]) -> None:
        """검색 목록에서 날짜를 선택하면 해당 날짜의 일기를 띄웁니다."""
        if target_date:
            self.selected_date = target_date
            self.calendar.update_selected_date(target_date)
            self.load_diary_for_date(target_date)

    def action_prev_month(self) -> None:
        """캘린더 월을 한 달 뒤로 이동시킵니다."""
        self.calendar.prev_month()

    def action_next_month(self) -> None:
        """캘린더 월을 한 달 앞으로 이동시킵니다."""
        self.calendar.next_month()

    def action_open_image(self) -> None:
        """첨부 이미지가 있으면 로컬 xdg-open 뷰어로 띄웁니다."""
        if self.current_entry and self.current_entry.get("image_path"):
            img_path = self.current_entry["image_path"]
            success = open_image_external(img_path)
            if success:
                self.notify("외부 이미지 뷰어를 통해 이미지를 열었습니다.", title="이미지 띄우기")
            else:
                self.notify("이미지 뷰어를 가동할 수 없습니다. 경로를 확인해 주세요.", title="뷰어 실패", severity="warning")
        else:
            self.notify("첨부된 이미지가 존재하지 않습니다.", title="이미지 없음", severity="warning")

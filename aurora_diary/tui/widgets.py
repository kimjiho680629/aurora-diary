import calendar
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from textual.app import ComposeResult
from textual.widget import Widget
from textual.widgets import Static, Button
from textual.message import Message

class CalendarWidget(Widget):
    """일기 작성 이력과 기분 이모지를 시각화하는 고성능 TUI 캘린더 위젯"""
    
    # 클릭 및 변경 시 방출할 커스텀 이벤트
    class DateSelected(Message):
        def __init__(self, selected_date: date):
            self.selected_date = selected_date
            super().__init__()

    def __init__(self, storage: Any, initial_date: Optional[date] = None, **kwargs):
        super().__init__(**kwargs)
        self.storage = storage
        self.current_date = initial_date or date.today()
        self.selected_date = self.current_date
        self.diary_map: Dict[str, Dict[str, Any]] = {}
        self._load_diary_data()

    def _load_diary_data(self):
        """현재 년/월의 일기 작성 정보를 로드합니다."""
        self.diary_map = self.storage.get_entries_in_month(
            self.current_date.year, self.current_date.month
        )

    def compose(self) -> ComposeResult:
        # 1. 월 네비게이션 헤더
        month_name = self.current_date.strftime("%B %Y")
        yield Static(f"◀  {month_name}  ▶", classes="calendar-header")
        
        # 2. 요일 헤더 그리드
        day_names = ["월", "화", "수", "목", "금", "토", "일"]
        grid = Widget(classes="calendar-grid")
        
        # 그리드 내부 자식 구성
        sub_widgets = []
        for d in day_names:
            sub_widgets.append(Static(d, classes="calendar-day-name"))
            
        # 달력 날짜 행렬 빌드
        cal = calendar.Calendar(firstweekday=0) # 월요일부터 시작
        month_days = cal.monthdayscalendar(self.current_date.year, self.current_date.month)
        
        for week in month_days:
            for day in week:
                if day == 0:
                    # 해당 월이 아닌 빈 칸
                    sub_widgets.append(Static("", classes="calendar-day-btn"))
                else:
                    curr_day_date = date(self.current_date.year, self.current_date.month, day)
                    date_str = curr_day_date.isoformat()
                    has_diary = date_str in self.diary_map
                    
                    # 텍스트 라벨 결정 (일기가 있으면 이모지 + 날짜, 없으면 날짜만)
                    label = str(day)
                    classes_list = ["calendar-day-btn"]
                    
                    if curr_day_date == date.today():
                        classes_list.append("calendar-day-today")
                    if has_diary:
                        classes_list.append("calendar-day-has-diary")
                        mood_emoji = self.diary_map[date_str].get("mood", "😐")
                        label = f"{day}\n{mood_emoji}"
                    if curr_day_date == self.selected_date:
                        classes_list.append("calendar-day-selected")
                        
                    btn = Button(
                        label,
                        classes=" ".join(classes_list)
                    )
                    # 각 버튼에 해당 날짜 정보를 커스텀 바인딩
                    btn.date_value = curr_day_date
                    sub_widgets.append(btn)
                    
        grid.compose = lambda: sub_widgets
        yield grid

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """날짜 버튼 클릭 시 이벤트를 부모 컴포넌트로 전송하고 선택을 갱신합니다."""
        btn = event.button
        if hasattr(btn, "date_value"):
            self.selected_date = btn.date_value
            self.post_message(self.DateSelected(self.selected_date))
            self.refresh_calendar()

    def on_click(self, event) -> None:
        """헤더의 ◀ 또는 ▶ 영역 클릭을 감지하여 월 이동 처리"""
        # 헤더 텍스트 ◀  [Month]  ▶ 파싱을 통한 간단한 클릭 검출
        # (간단한 TUI 클릭 바운더리 체크 대신 헤더 컴포넌트 이벤트 가로채기 방식)
        pass

    def prev_month(self):
        """이전 월로 달력을 변경합니다."""
        year, month = self.current_date.year, self.current_date.month
        if month == 1:
            month = 12
            year -= 1
        else:
            month -= 1
        self.current_date = date(year, month, 1)
        self._load_diary_data()
        self.refresh_calendar()

    def next_month(self):
        """다음 월로 달력을 변경합니다."""
        year, month = self.current_date.year, self.current_date.month
        if month == 12:
            month = 1
            year += 1
        else:
            month += 1
        self.current_date = date(year, month, 1)
        self._load_diary_data()
        self.refresh_calendar()

    def refresh_calendar(self):
        """달력의 내부 레이아웃을 갱신하여 그립니다."""
        # 내부 구조 재생성
        self.remove_children()
        self._load_diary_data()
        self.mount_all(self.compose())

    def update_selected_date(self, new_date: date):
        """외부에서 선택 날짜가 바뀌었을 때 동기화합니다."""
        self.selected_date = new_date
        # 연월이 변경된 경우 달력 포커스도 이동
        if (self.current_date.year, self.current_date.month) != (new_date.year, new_date.month):
            self.current_date = date(new_date.year, new_date.month, 1)
        self.refresh_calendar()


class StatsWidget(Widget):
    """최근 감정 데이터를 분석하여 아스키 가로형 차트로 트래킹을 제공하는 통계 위젯"""
    
    def __init__(self, storage: Any, days: int = 30, **kwargs):
        super().__init__(**kwargs)
        self.storage = storage
        self.days = days
        self.border_title = f"📊 최근 {days}일 감정 트래커"

    def compose(self) -> ComposeResult:
        stats = self.storage.get_mood_stats(self.days)
        
        # 통계 렌더링용 서브 패널
        if not stats or all(count == 0 for _, count, _ in stats):
            yield Static(
                "작성된 일기가 없습니다.\n일기를 작성하고 감정 통계를 확인해 보세요! ✨",
                classes="stats-empty-guide"
            )
            return

        yield Static("감정 분포 현황:", classes="stats-title-label")

        # 오로라 컬러 매핑
        mood_colors = {
            "🤩": "#EC4899",  # Neon Pink
            "😊": "#06B6D4",  # Neon Cyan
            "😐": "#8B5CF6",  # Neon Purple
            "😢": "#94A3B8",  # Muted Slate
            "😡": "#EF4444"   # Red
        }

        for mood, count, pct in stats:
            # 아스키 진행률 바 조립 (예: ██████░░░░)
            bar_length = 20
            filled_length = int(round((pct / 100.0) * bar_length))
            bar_str = "█" * filled_length + "░" * (bar_length - filled_length)
            
            color = mood_colors.get(mood, "#F8FAFC")
            row_text = f"{mood}  [{color}]{bar_str}[/]  {count:2d}회 ({pct:5.1f}%)"
            
            yield Static(row_text, classes="stats-bar-row")

    def refresh_stats(self):
        """통계를 새로 쿼리하여 리프레시합니다."""
        self.remove_children()
        self.mount_all(self.compose())

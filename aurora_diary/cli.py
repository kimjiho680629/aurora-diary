import sys
import argparse
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

from aurora_diary import __version__
from aurora_diary.storage import DiaryStorage

# CLI 및 터미널 전용 출력 콘솔 정의
console = Console()

def print_banner():
    """CLI 시작 시 Midnight Aurora 풍의 시안/보라 텍스트 배너를 출력합니다."""
    banner = Text()
    banner.append("🌌 Aurora Diary CLI ", style="bold #06B6D4")
    banner.append(f"v{__version__}\n", style="bold #8B5CF6")
    banner.append("Midnight Aurora 프리미엄 TUI / CLI 일기 시스템", style="italic #94A3B8")
    
    console.print(Panel(banner, border_style="#8B5CF6", expand=False))

def list_entries_cli(storage: DiaryStorage, limit: int = 10):
    """최근 일기 목록을 터미널 테이블 형태로 예쁘게 출력합니다."""
    entries = storage.get_all_entries()[:limit]
    
    if not entries:
        console.print("[yellow][!] 등록된 일기가 존재하지 않습니다. 먼저 일기를 작성해 보세요.[/yellow]")
        return
        
    table = Table(
        title="🌌 최근 작성한 일기 목록",
        title_style="bold #06B6D4",
        border_style="#475569",
        header_style="bold #8B5CF6"
    )
    table.add_column("날짜 (Date)", style="bold #F8FAFC", justify="center")
    table.add_column("기분 (Mood)", justify="center")
    table.add_column("제목 (Title)", style="#F8FAFC")
    table.add_column("태그 (Tags)", style="#06B6D4")
    table.add_column("최종 수정일 (Updated At)", style="#94A3B8")

    for entry in entries:
        tags = ", ".join([f"#{t}" for t in entry.get("tags", [])]) or "-"
        table.add_row(
            entry["date"],
            entry.get("mood", "😐"),
            entry.get("title", ""),
            tags,
            entry.get("updated_at", "")[:16].replace("T", " ")
        )
        
    console.print(table)

def search_entries_cli(storage: DiaryStorage, query: str):
    """지정한 키워드로 일기를 검색해 테이블 형태로 터미널에 반환합니다."""
    results = storage.search_entries(query=query)
    
    if not results:
        console.print(f"[bold red]검색 결과 없음[/bold red]: [white]'{query}' 키워드에 매칭되는 일기가 없습니다.[/white]")
        return
        
    table = Table(
        title=f"🔍 '{query}' 키워드 검색 결과 ({len(results)}건)",
        title_style="bold #06B6D4",
        border_style="#475569",
        header_style="bold #8B5CF6"
    )
    table.add_column("날짜", style="bold", justify="center")
    table.add_column("기분", justify="center")
    table.add_column("제목", style="white")
    table.add_column("일치하는 태그", style="#06B6D4")
    table.add_column("내용 일부 요약 (Excerpt)", style="#94A3B8", max_width=40)

    for entry in results:
        tags = ", ".join([f"#{t}" for t in entry.get("tags", [])]) or "-"
        # 본문 요약 가공 (줄바꿈 제거 및 최대 40자)
        content_summary = entry.get("content", "").replace("\n", " ").strip()
        if len(content_summary) > 37:
            content_summary = content_summary[:37] + "..."
            
        table.add_row(
            entry["date"],
            entry.get("mood", "😐"),
            entry.get("title", ""),
            tags,
            content_summary or "[본문 없음]"
        )
        
    console.print(table)

def main():
    parser = argparse.ArgumentParser(
        description="🌌 Aurora Diary: Midnight Aurora 테마 기반 프리미엄 TUI 일기장"
    )
    
    # 상호 배타적이거나 파라미터가 있는 명령어 옵션들
    parser.add_argument(
        "--tui", action="store_true",
        help="Midnight Aurora TUI 일기장을 가동합니다 (기본 동작)"
    )
    parser.add_argument(
        "-l", "--list", type=int, nargs="?", const=10, metavar="N",
        help="최근 N개의 일기 목록을 터미널에 출력합니다. (기본값: 10개)"
    )
    parser.add_argument(
        "-s", "--search", type=str, metavar="KEYWORD",
        help="지정한 키워드가 포함된 일기를 터미널 CLI 상에서 실시간 조회합니다."
    )
    parser.add_argument(
        "-e", "--export", type=str, metavar="BACKUP_PATH",
        help="현재 일기장 데이터베이스(JSON)를 안전한 로컬 백업 파일로 내보냅니다."
    )
    parser.add_argument(
        "-i", "--import-db", type=str, dest="import_db", metavar="BACKUP_PATH",
        help="백업된 JSON 파일로부터 데이터를 복구 및 덮어씌웁니다."
    )
    parser.add_argument(
        "-v", "--version", action="version", version=f"🌌 Aurora Diary v{__version__}",
        help="Aurora Diary의 버전 정보를 출력합니다."
    )

    args = parser.parse_args()
    
    # 스토리지 자동 인스턴스화
    storage = DiaryStorage()
    
    # 1. 내보내기(Export) 액션
    if args.export:
        print_banner()
        console.print(f"[bold #8B5CF6][i] 일기 데이터를 백업 경로로 내보내는 중: {args.export}...[/bold #8B5CF6]")
        if storage.export_db(args.export):
            console.print(f"[bold green]✔ 백업 성공![/bold green] 일기가 안전하게 저장되었습니다: [underline]{args.export}[/underline]")
        else:
            console.print("[bold red]❌ 백업 실패![/bold red] 대상 파일 경로에 쓰기 권한이 있는지 확인해 주세요.", file=sys.stderr)
        return
        
    # 2. 가져오기(Import) 액션
    if args.import_db:
        print_banner()
        console.print(f"[bold red][!] 경고: 데이터를 가져오면 현재 등록된 모든 일기가 덮어씌워져 소실됩니다![/bold red]")
        confirm = input("정말로 백업 데이터 복구를 진행하시겠습니까? (y/N): ").strip().lower()
        if confirm != 'y':
            console.print("[yellow]데이터 가져오기가 취소되었습니다.[/yellow]")
            return
            
        console.print(f"[bold #8B5CF6][i] 백업 파일을 불러오는 중: {args.import_db}...[/bold #8B5CF6]")
        if storage.import_db(args.import_db):
            console.print("[bold green]✔ 데이터 복구 완료![/bold green] 백업 일기들이 성공적으로 마운트되었습니다.")
        else:
            console.print("[bold red]❌ 복구 실패![/bold red] 백업 파일이 손상되었거나 올바른 Aurora JSON 포맷이 아닙니다.", file=sys.stderr)
        return

    # 3. CLI 단순 목록 조회 액션
    if args.list is not None:
        print_banner()
        list_entries_cli(storage, args.list)
        return

    # 4. CLI 키워드 검색 액션
    if args.search:
        print_banner()
        search_entries_cli(storage, args.search)
        return

    # 5. 기본 동작: TUI 프로그램 구동
    # 가끔 CLI로 출력하는 대신 TUI를 요구하거나 인자가 없는 경우
    # 윈도우 크기 예외 등을 철저히 보호하기 위해 TUI Import는 여기서 필요할 때 수행
    try:
        from aurora_diary.tui.app import AuroraDiaryApp
        app = AuroraDiaryApp(storage=storage)
        app.run()
    except Exception as e:
        console.print(f"[bold red]❌ TUI 가동 실패: {str(e)}[/bold red]", file=sys.stderr)
        console.print("[yellow]터미널 크기가 최소 요구 해상도(80x24 이상)를 충족하는지 또는 TrueColor를 지원하는지 확인해 주세요.[/yellow]")
        sys.exit(1)

if __name__ == "__main__":
    main()

import { DiaryEntry } from '../types/diary';

// Check if running inside Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

const STORAGE_KEY = 'aurora_diaries_fallback';

export async function fetchDiaries(): Promise<Record<string, DiaryEntry>> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<Record<string, DiaryEntry>>('load_diaries');
    } catch (e) {
      console.warn('Tauri invoke load_diaries failed, falling back to localStorage:', e);
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Initial demo data matching Aurora Diary format
    const initial: Record<string, DiaryEntry> = {
      '2026-09-14': {
        date: '2026-09-14',
        title: 'Aurora Diary 그래픽 앱 개발 시작',
        content: `### 🌌 새로운 그래픽 인터페이스로의 도약\n\n기존 터미널 TUI의 감성을 유지하면서 macOS의 아름다운 그래픽 환경과 글래스모피즘을 접목한 **Aurora Diary Desktop**을 개발하기 시작했다.\n\n- [x] Midnight Aurora 다크 네온 디자인 시스템 적용\n- [x] 반응형 캘린더 그리드 및 무드 트래커\n- [x] 고해상도 이미지 첨부 및 실시간 마크다운 프리뷰\n\n앞으로의 일기 작성이 훨씬 즐거워질 것 같다!`,
        mood: '✨',
        tags: ['개발', 'Aurora', 'macOS'],
        updated_at: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_diary', { entry });
      return;
    } catch (e) {
      console.warn('Tauri invoke save_diary failed, saving to localStorage:', e);
    }
  }

  const current = await fetchDiaries();
  current[entry.date] = entry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export async function deleteDiaryEntry(date: string): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('delete_diary', { date });
      return;
    } catch (e) {
      console.warn('Tauri invoke delete_diary failed:', e);
    }
  }

  const current = await fetchDiaries();
  delete current[date];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export async function copyAttachmentImage(sourcePath: string): Promise<string> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('copy_image_to_storage', { sourcePath });
    } catch (e) {
      console.warn('Tauri invoke copy_image_to_storage failed:', e);
    }
  }
  return sourcePath;
}

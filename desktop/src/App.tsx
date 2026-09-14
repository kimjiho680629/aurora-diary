import React, { useState, useEffect, useMemo } from 'react';
import { DiaryEntry } from './types/diary';
import { fetchDiaries, saveDiaryEntry, deleteDiaryEntry } from './services/storage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { DiaryEditor } from './components/DiaryEditor';
import { DiaryViewer } from './components/DiaryViewer';
import { StatsModal } from './components/StatsModal';

export const App: React.FC = () => {
  const [diaries, setDiaries] = useState<Record<string, DiaryEntry>>({});
  const [loading, setLoading] = useState(true);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Active Date & Modal states
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>(undefined);
  const [statsOpen, setStatsOpen] = useState(false);

  // Load diaries on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchDiaries();
        setDiaries(data);
      } catch (e) {
        console.error('Failed to load diaries:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtered entries for list view and search
  const filteredEntries = useMemo(() => {
    const list = Object.values(diaries).sort((a, b) => b.date.localeCompare(a.date));

    return list.filter((item) => {
      // Mood filter
      if (selectedMood && item.mood !== selectedMood) return false;

      // Tag filter
      if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inContent = item.content.toLowerCase().includes(q);
        const inTag = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inTag) return false;
      }

      return true;
    });
  }, [diaries, selectedMood, selectedTag, searchQuery]);

  // Aggregate tags for sidebar
  const allTags = useMemo(() => {
    const map: Record<string, number> = {};
    Object.values(diaries).forEach((e) => {
      e.tags?.forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return Object.entries(map).map(([tag, count]) => ({ tag, count }));
  }, [diaries]);

  // Streak calculation
  const streakCount = useMemo(() => {
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      if (diaries[dateKey]) {
        count++;
      } else {
        // If today is empty, check yesterday before breaking
        if (i === 0) continue;
        break;
      }
    }
    return count;
  }, [diaries]);

  // Handlers
  const handleOpenEntry = (date: string) => {
    if (diaries[date]) {
      setViewingDate(date);
    } else {
      // Open editor for new entry on that date
      setSelectedDate(date);
      setEditingEntry(undefined);
      setEditorOpen(true);
    }
  };

  const handleNewDiaryToday = () => {
    setSelectedDate(todayStr);
    setEditingEntry(diaries[todayStr]);
    setEditorOpen(true);
  };

  const handleSaveDiary = async (entry: DiaryEntry) => {
    try {
      await saveDiaryEntry(entry);
      setDiaries((prev) => ({ ...prev, [entry.date]: entry }));
      setEditorOpen(false);
      setEditingEntry(undefined);
    } catch (e) {
      alert('일기 저장에 실패했습니다: ' + e);
    }
  };

  const handleDeleteDiary = async (date: string) => {
    try {
      await deleteDiaryEntry(date);
      setDiaries((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      setViewingDate(null);
    } catch (e) {
      alert('일기 삭제에 실패했습니다: ' + e);
    }
  };

  const handleEditFromViewer = (entry: DiaryEntry) => {
    setViewingDate(null);
    setEditingEntry(entry);
    setSelectedDate(entry.date);
    setEditorOpen(true);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-aurora-bg overflow-hidden text-slate-100 selection:bg-aurora-cyan/30 selection:text-white">
      {/* Aurora Ambient Background Glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-aurora-cyan/15 blur-3xl animate-aurora" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-aurora-purple/15 blur-3xl animate-aurora" style={{ animationDelay: '4s' }} />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-aurora-pink/10 blur-3xl animate-aurora" style={{ animationDelay: '8s' }} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewDiary={handleNewDiaryToday}
        onOpenStats={() => setStatsOpen(true)}
      />

      {/* Main Container with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden z-10">
        <Sidebar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedMood={selectedMood}
          onSelectMood={setSelectedMood}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          allTags={allTags}
          totalEntries={Object.keys(diaries).length}
          streakCount={streakCount}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-aurora-bg/30">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-aurora-cyan border-t-transparent animate-spin" />
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarView
              diaries={diaries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenEntry={handleOpenEntry}
            />
          ) : (
            <ListView
              entries={filteredEntries}
              onOpenEntry={handleOpenEntry}
              onNewDiary={handleNewDiaryToday}
            />
          )}
        </main>
      </div>

      {/* Diary Viewer Modal */}
      {viewingDate && diaries[viewingDate] && (
        <DiaryViewer
          entry={diaries[viewingDate]}
          onEdit={handleEditFromViewer}
          onDelete={handleDeleteDiary}
          onClose={() => setViewingDate(null)}
        />
      )}

      {/* Diary Editor Modal */}
      {editorOpen && (
        <DiaryEditor
          initialEntry={editingEntry}
          defaultDate={selectedDate}
          onSave={handleSaveDiary}
          onClose={() => {
            setEditorOpen(false);
            setEditingEntry(undefined);
          }}
        />
      )}

      {/* Stats Modal */}
      {statsOpen && (
        <StatsModal
          diaries={diaries}
          onClose={() => setStatsOpen(false)}
        />
      )}
    </div>
  );
};

import React from 'react';
import { Calendar, BookOpen, Tag, Smile, Flame } from 'lucide-react';
import { MOOD_OPTIONS } from '../types/diary';

interface SidebarProps {
  viewMode: 'calendar' | 'list';
  onViewModeChange: (mode: 'calendar' | 'list') => void;
  selectedMood: string | null;
  onSelectMood: (mood: string | null) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  allTags: { tag: string; count: number }[];
  totalEntries: number;
  streakCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  viewMode,
  onViewModeChange,
  selectedMood,
  onSelectMood,
  selectedTag,
  onSelectTag,
  allTags,
  totalEntries,
  streakCount,
}) => {
  return (
    <aside className="w-64 border-r border-aurora-border/60 bg-aurora-bg/60 backdrop-blur-xl flex flex-col justify-between select-none h-full">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="space-y-1">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-aurora-cyan/15 text-aurora-cyan border border-aurora-cyan/30 shadow-neon-cyan'
                : 'text-slate-400 hover:text-slate-200 hover:bg-aurora-surface/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>오로라 캘린더</span>
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-aurora-purple/15 text-aurora-purple border border-aurora-purple/30 shadow-neon-purple'
                : 'text-slate-400 hover:text-slate-200 hover:bg-aurora-surface/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>타임라인 피드</span>
          </button>
        </div>

        {/* Stats Summary Widget */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-aurora-surface/80 to-aurora-surfaceLight/40 border border-aurora-border/70 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>기록 현황</span>
            <span className="flex items-center text-amber-400 font-bold">
              <Flame className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
              {streakCount}일 연속
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-slate-100">{totalEntries}</span>
            <span className="text-[11px] text-slate-400">개의 추억</span>
          </div>
        </div>

        {/* Mood Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold">
              <Smile className="w-3.5 h-3.5 text-aurora-pink" />
              <span>감정 필터</span>
            </div>
            {selectedMood && (
              <button
                onClick={() => onSelectMood(null)}
                className="text-[10px] text-aurora-cyan hover:underline"
              >
                초기화
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MOOD_OPTIONS.map(({ emoji, label }) => {
              const isSelected = selectedMood === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => onSelectMood(isSelected ? null : emoji)}
                  title={label}
                  className={`h-9 flex items-center justify-center rounded-xl text-base transition-all ${
                    isSelected
                      ? 'bg-aurora-pink/20 border-2 border-aurora-pink shadow-neon-pink scale-105'
                      : 'bg-aurora-surface/40 hover:bg-aurora-surface/80 border border-aurora-border/50 opacity-80 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold">
              <Tag className="w-3.5 h-3.5 text-aurora-cyan" />
              <span>태그 모아보기</span>
            </div>
            {selectedTag && (
              <button
                onClick={() => onSelectTag(null)}
                className="text-[10px] text-aurora-cyan hover:underline"
              >
                전체
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.length === 0 ? (
              <span className="text-[11px] text-slate-500 italic px-1">
                등록된 태그가 없습니다.
              </span>
            ) : (
              allTags.map(({ tag, count }) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(isSelected ? null : tag)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-aurora-cyan text-slate-950 font-bold shadow-neon-cyan'
                        : 'bg-aurora-surface/70 text-slate-300 border border-aurora-border hover:border-aurora-cyan/50'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="text-[9px] opacity-70 ml-1">({count})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-3.5 border-t border-aurora-border/50 text-center">
        <p className="text-[11px] font-mono text-slate-500">
          Midnight Aurora Theme
        </p>
      </div>
    </aside>
  );
};

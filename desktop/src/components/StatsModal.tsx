import React from 'react';
import { X, BarChart2, Award, Calendar, Tag } from 'lucide-react';
import { DiaryEntry, MOOD_OPTIONS } from '../types/diary';

interface StatsModalProps {
  diaries: Record<string, DiaryEntry>;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ diaries, onClose }) => {
  const entries = Object.values(diaries);
  const total = entries.length;

  // Mood counts
  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  // Tag counts
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="glass-panel w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-aurora-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-aurora-border/60 bg-aurora-surface/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-aurora-purple/20 border border-aurora-purple/40 flex items-center justify-center text-aurora-purple shadow-neon-purple">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                오로라 다이어리 통계 분석
              </h2>
              <p className="text-xs text-slate-400">
                지금까지 기록된 감정과 추억의 흐름을 한눈에 살펴봅니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-aurora-border hover:bg-aurora-surface text-slate-400 hover:text-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-aurora-border/80">
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                <Calendar className="w-4 h-4 text-aurora-cyan" />
                <span>총 작성 일기</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-100">
                {total}
                <span className="text-sm font-normal text-slate-400 ml-1.5">편</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-aurora-border/80">
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                <Award className="w-4 h-4 text-aurora-pink" />
                <span>누적 기록 태그</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-100">
                {Object.keys(tagCounts).length}
                <span className="text-sm font-normal text-slate-400 ml-1.5">개</span>
              </div>
            </div>
          </div>

          {/* Mood Analysis Bar Charts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              감정 분포 (Mood Breakdown)
            </h3>
            <div className="space-y-2.5">
              {MOOD_OPTIONS.map(({ emoji, label }) => {
                const count = moodCounts[emoji] || 0;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={emoji} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center space-x-2 text-slate-200">
                        <span className="text-base">{emoji}</span>
                        <span>{label}</span>
                      </span>
                      <span className="font-mono text-slate-400">
                        {count}회 ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-aurora-surface overflow-hidden border border-aurora-border/40">
                      <div
                        className="h-full bg-gradient-to-r from-aurora-cyan to-aurora-purple rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Tags */}
          {sortedTags.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-aurora-cyan" />
                가장 많이 기록된 태그 TOP 5
              </h3>
              <div className="flex flex-wrap gap-2">
                {sortedTags.map(([tag, count], idx) => (
                  <div
                    key={tag}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-aurora-surface border border-aurora-border text-xs text-slate-200"
                  >
                    <span className="text-aurora-cyan font-bold">#{idx + 1}</span>
                    <span>#{tag}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({count}회)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

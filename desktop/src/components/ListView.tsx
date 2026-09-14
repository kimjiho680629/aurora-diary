import React from 'react';
import { Calendar, Tag, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { DiaryEntry } from '../types/diary';

interface ListViewProps {
  entries: DiaryEntry[];
  onOpenEntry: (date: string) => void;
  onNewDiary: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  entries,
  onOpenEntry,
  onNewDiary,
}) => {
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-aurora-surface border border-aurora-border flex items-center justify-center mb-4 text-aurora-purple shadow-neon-purple">
          <Calendar className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-slate-200 mb-1">
          일치하는 일기가 없습니다
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          검색 조건을 변경하거나 오늘 하루의 소중한 순간을 기록해 보세요.
        </p>
        <button
          onClick={onNewDiary}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-aurora-cyan to-aurora-purple text-slate-950 font-bold text-xs shadow-neon-cyan hover:opacity-90 transition-opacity"
        >
          새 일기 작성하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-400">
          총 <span className="text-aurora-cyan font-mono">{entries.length}</span>개의 일기
        </h2>
      </div>

      <div className="grid gap-3.5">
        {entries.map((entry) => (
          <div
            key={entry.date}
            onClick={() => onOpenEntry(entry.date)}
            className="group glass-panel rounded-2xl p-5 hover:border-aurora-cyan/50 hover:bg-aurora-surfaceLight/80 transition-all cursor-pointer shadow-lg hover:shadow-neon-cyan/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start space-x-4 flex-1">
              {/* Mood Badge */}
              <div className="w-12 h-12 rounded-2xl bg-aurora-bg/80 border border-aurora-border/80 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                {entry.mood}
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2.5 mb-1">
                  <span className="text-xs font-mono text-aurora-cyan font-semibold">
                    {entry.date}
                  </span>
                  {entry.image_path && (
                    <span className="flex items-center text-[10px] text-aurora-purple bg-aurora-purple/10 px-2 py-0.5 rounded-full border border-aurora-purple/30">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      사진
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-aurora-cyan transition-colors truncate">
                  {entry.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {entry.content.replace(/[#*`_~[\]]/g, '')}
                </p>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {entry.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-aurora-surface border border-aurora-border/80 text-slate-300 flex items-center"
                      >
                        <Tag className="w-2.5 h-2.5 mr-1 opacity-60" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <div className="hidden sm:flex items-center text-slate-500 group-hover:text-aurora-cyan group-hover:translate-x-1 transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, BarChart2, PlusCircle, Search } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewDiary: () => void;
  onOpenStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNewDiary,
  onOpenStats,
}) => {
  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header
      data-tauri-drag-region
      className="h-16 border-b border-aurora-border/60 bg-aurora-bg/80 backdrop-blur-md px-4 pl-20 flex items-center justify-between select-none z-20"
    >
      {/* Title & Brand */}
      <div className="flex items-center space-x-3 pointer-events-none">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-aurora-cyan via-aurora-purple to-aurora-pink flex items-center justify-center shadow-neon-cyan">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wider bg-gradient-to-r from-aurora-cyan via-aurora-purple to-aurora-pink bg-clip-text text-transparent">
            AURORA DIARY
          </h1>
          <span className="text-[11px] text-slate-400 font-mono tracking-tight">
            {todayStr}
          </span>
        </div>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="일기 제목, 본문, 태그(#) 검색..."
            className="w-full bg-aurora-surface/80 border border-aurora-border/80 focus:border-aurora-cyan focus:ring-1 focus:ring-aurora-cyan/50 text-xs rounded-full pl-9 pr-4 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onOpenStats}
          title="감정 통계 & 리포트"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-aurora-border hover:border-aurora-purple/60 hover:bg-aurora-surface text-slate-300 hover:text-aurora-purple text-xs font-medium transition-all"
        >
          <BarChart2 className="w-4 h-4" />
          <span className="hidden sm:inline">통계</span>
        </button>

        <button
          onClick={onNewDiary}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-aurora-cyan to-aurora-purple hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-semibold text-xs shadow-neon-cyan transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>오늘 일기 쓰기</span>
        </button>
      </div>
    </header>
  );
};

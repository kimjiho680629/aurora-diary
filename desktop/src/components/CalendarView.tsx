import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { DiaryEntry } from '../types/diary';

interface CalendarViewProps {
  diaries: Record<string, DiaryEntry>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenEntry: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  diaries,
  selectedDate,
  onSelectDate,
  onOpenEntry,
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayStr = today.toISOString().split('T')[0];
    onSelectDate(todayStr);
  };

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ day, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (up to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, dateStr, isCurrentMonth: false });
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-aurora-cyan via-purple-300 to-aurora-pink bg-clip-text text-transparent">
            {year}년 {month + 1}월
          </h2>
          <button
            onClick={handleToday}
            className="text-[11px] px-2.5 py-1 rounded-full border border-aurora-cyan/40 bg-aurora-cyan/10 text-aurora-cyan hover:bg-aurora-cyan/20 transition-all font-medium flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            오늘
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-aurora-border hover:bg-aurora-surface text-slate-300 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-aurora-border hover:bg-aurora-surface text-slate-300 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
        {weekdays.map((w, idx) => (
          <div
            key={w}
            className={`py-1.5 ${idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-aurora-cyan' : ''}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-2.5 auto-rows-fr">
        {days.map(({ day, dateStr, isCurrentMonth }) => {
          const entry = diaries[dateStr];
          const isSelected = selectedDate === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div
              key={dateStr}
              onClick={() => {
                onSelectDate(dateStr);
                if (entry) {
                  onOpenEntry(dateStr);
                }
              }}
              className={`group relative rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden border ${
                isSelected
                  ? 'border-aurora-cyan bg-aurora-surfaceLight/80 shadow-neon-cyan scale-[1.02] z-10'
                  : entry
                  ? 'border-aurora-border/80 bg-aurora-surface/70 hover:border-aurora-purple/60 hover:bg-aurora-surfaceLight/60 hover:shadow-lg'
                  : 'border-aurora-border/30 bg-aurora-bg/30 hover:border-aurora-border/70 hover:bg-aurora-surface/30'
              } ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-medium ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-aurora-pink text-white flex items-center justify-center font-bold shadow-neon-pink'
                      : isSelected
                      ? 'text-aurora-cyan font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  {day}
                </span>

                {entry && (
                  <span className="text-base transform group-hover:scale-125 transition-transform">
                    {entry.mood}
                  </span>
                )}
              </div>

              {/* Entry Preview snippet */}
              {entry ? (
                <div className="mt-1 flex-1 flex flex-col justify-end">
                  <p className="text-[11px] font-medium text-slate-200 truncate group-hover:text-aurora-cyan transition-colors">
                    {entry.title}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 overflow-hidden">
                      {entry.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-aurora-bg/80 text-aurora-cyan/90 border border-aurora-border/50 truncate"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity">
                  <span className="text-[10px] text-slate-500 font-mono">+ 일기 쓰기</span>
                </div>
              )}

              {/* Aurora Glow dot for entries */}
              {entry && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-aurora-cyan shadow-neon-cyan animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

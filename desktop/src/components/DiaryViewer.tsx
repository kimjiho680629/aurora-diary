import React, { useState } from 'react';
import { Calendar, Tag, Edit3, Trash2, X, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DiaryEntry } from '../types/diary';

interface DiaryViewerProps {
  entry: DiaryEntry;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
}

export const DiaryViewer: React.FC<DiaryViewerProps> = ({
  entry,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const handleDelete = () => {
    if (confirm(`'${entry.date}' 일기를 정말 삭제하시겠습니까?`)) {
      onDelete(entry.date);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-aurora-border/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="p-6 border-b border-aurora-border/60 bg-aurora-surface/50 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-aurora-bg border border-aurora-border flex items-center justify-center text-3xl shadow-neon-pink/30">
              {entry.mood}
            </div>
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-aurora-cyan">
                <Calendar className="w-3.5 h-3.5" />
                <span>{entry.date}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">
                {entry.title}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 rounded-xl border border-aurora-border hover:border-aurora-cyan text-slate-300 hover:text-aurora-cyan hover:bg-aurora-surface transition-all"
              title="수정"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl border border-aurora-border hover:border-rose-500 text-slate-300 hover:text-rose-400 hover:bg-aurora-surface transition-all"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-6 bg-aurora-border mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-aurora-border hover:bg-aurora-surface text-slate-400 hover:text-slate-100 transition-all"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image Attachment (High-res Graphic) */}
          {entry.image_path && (
            <div className="relative group rounded-2xl overflow-hidden border border-aurora-border/80 bg-slate-900 max-h-96 flex items-center justify-center">
              <img
                src={entry.image_path}
                alt="Diary attachment"
                className="w-full h-auto max-h-96 object-contain cursor-pointer transition-transform group-hover:scale-[1.01]"
                onClick={() => setImageModalOpen(true)}
                onError={(e) => {
                  // Fallback for broken path
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <button
                onClick={() => setImageModalOpen(true)}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-900/80 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="원본 확대"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-3 font-normal">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {entry.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="pt-4 border-t border-aurora-border/40 flex flex-wrap gap-2">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono px-3 py-1 rounded-full bg-aurora-surface border border-aurora-border text-aurora-cyan/90 flex items-center"
                >
                  <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && entry.image_path && (
        <div
          onClick={() => setImageModalOpen(false)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={entry.image_path}
            alt="Full size attachment"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

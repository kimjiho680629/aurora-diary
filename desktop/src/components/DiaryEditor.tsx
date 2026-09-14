import React, { useState, useRef } from 'react';
import {
  Calendar,
  X,
  Save,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  CheckSquare,
  Code,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DiaryEntry, MOOD_OPTIONS, MoodType } from '../types/diary';
import { copyAttachmentImage } from '../services/storage';

interface DiaryEditorProps {
  initialEntry?: DiaryEntry;
  defaultDate: string;
  onSave: (entry: DiaryEntry) => void;
  onClose: () => void;
}

export const DiaryEditor: React.FC<DiaryEditorProps> = ({
  initialEntry,
  defaultDate,
  onSave,
  onClose,
}) => {
  const [date, setDate] = useState(initialEntry?.date || defaultDate);
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState<MoodType>((initialEntry?.mood as MoodType) || '😊');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [imagePath, setImagePath] = useState<string | undefined>(initialEntry?.image_path);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('write');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Image Upload handler (supports Tauri local copy & browser blob)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if webkitRelativePath or path is available
    const rawPath = (file as unknown as { path?: string }).path;
    if (rawPath) {
      try {
        const savedPath = await copyAttachmentImage(rawPath);
        setImagePath(savedPath);
      } catch (err) {
        console.error('Failed to copy image via Tauri:', err);
      }
    } else {
      // Fallback: create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setImagePath(objectUrl);
    }
  };

  const insertMarkdownSyntax = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${before}${selected || '텍스트'}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 3));
    }, 10);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('일기 제목을 입력해 주세요.');
      return;
    }

    const entry: DiaryEntry = {
      date,
      title: title.trim(),
      content: content.trim(),
      mood,
      tags,
      image_path: imagePath,
      updated_at: new Date().toISOString(),
    };

    onSave(entry);

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#8B5CF6', '#EC4899', '#10B981'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-aurora-border animate-in fade-in zoom-in-95 duration-200">
        {/* Editor Top Bar */}
        <div className="p-5 border-b border-aurora-border/60 bg-aurora-surface/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold bg-gradient-to-r from-aurora-cyan to-aurora-purple bg-clip-text text-transparent">
              {initialEntry ? '일기 수정하기' : '새 일기 작성'}
            </span>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-aurora-bg border border-aurora-border text-xs font-mono text-aurora-cyan">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none text-aurora-cyan focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-aurora-cyan via-aurora-purple to-aurora-pink text-slate-950 font-bold text-xs shadow-neon-cyan hover:opacity-95 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>저장하기</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-aurora-border hover:bg-aurora-surface text-slate-400 hover:text-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="오늘 하루를 한 줄로 표현하자면..."
              className="w-full bg-aurora-surface/50 border border-aurora-border focus:border-aurora-cyan focus:ring-1 focus:ring-aurora-cyan/50 rounded-2xl px-5 py-3 text-lg font-bold text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          {/* Mood Selection Row */}
          <div className="flex items-center space-x-3 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 flex-shrink-0">
              오늘의 기분:
            </span>
            <div className="flex space-x-2">
              {MOOD_OPTIONS.map(({ emoji, label }) => {
                const isSelected = mood === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setMood(emoji)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-aurora-pink/20 border border-aurora-pink text-slate-100 shadow-neon-pink font-semibold scale-105'
                        : 'bg-aurora-surface/40 hover:bg-aurora-surface/80 border border-aurora-border text-slate-300'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-[11px]">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Attachment Preview / Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePath ? (
              <div className="relative group rounded-2xl overflow-hidden border border-aurora-border bg-slate-900 max-h-60 flex items-center justify-center">
                <img
                  src={imagePath}
                  alt="Attachment preview"
                  className="w-full h-auto max-h-60 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImagePath(undefined)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-rose-500/80 backdrop-blur-md text-white hover:bg-rose-600 transition-colors shadow-lg"
                  title="사진 제거"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-aurora-border/80 hover:border-aurora-cyan/60 rounded-2xl p-4 flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-aurora-cyan bg-aurora-bg/40 hover:bg-aurora-surface/30 transition-all cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-aurora-cyan" />
                <span>오늘을 담은 사진을 추가해 보세요 (JPG, PNG, WebP)</span>
              </button>
            )}
          </div>

          {/* Markdown Toolbar & View Mode Switch */}
          <div className="flex items-center justify-between border-y border-aurora-border/60 py-2">
            <div className="flex items-center space-x-1 text-slate-400">
              <button
                type="button"
                onClick={() => insertMarkdownSyntax('**', '**')}
                className="p-1.5 rounded hover:bg-aurora-surface hover:text-slate-200"
                title="굵게"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownSyntax('*', '*')}
                className="p-1.5 rounded hover:bg-aurora-surface hover:text-slate-200"
                title="기울임"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownSyntax('- ')}
                className="p-1.5 rounded hover:bg-aurora-surface hover:text-slate-200"
                title="글머리 기호"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownSyntax('- [ ] ')}
                className="p-1.5 rounded hover:bg-aurora-surface hover:text-slate-200"
                title="할 일 체크박스"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdownSyntax('```\n', '\n```')}
                className="p-1.5 rounded hover:bg-aurora-surface hover:text-slate-200"
                title="코드 블록"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-1 bg-aurora-surface rounded-lg p-0.5 border border-aurora-border text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-2.5 py-1 rounded-md flex items-center space-x-1 ${
                  activeTab === 'write'
                    ? 'bg-aurora-cyan text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit2 className="w-3 h-3" />
                <span>작성</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:flex px-2.5 py-1 rounded-md items-center space-x-1 ${
                  activeTab === 'split'
                    ? 'bg-aurora-cyan text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>분할</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md flex items-center space-x-1 ${
                  activeTab === 'preview'
                    ? 'bg-aurora-cyan text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>미리보기</span>
              </button>
            </div>
          </div>

          {/* Content Editor / Preview Pane */}
          <div className="min-h-[260px] flex">
            {activeTab !== 'preview' && (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="마크다운 문법을 지원합니다. 오늘 있었던 특별한 기억을 자유롭게 적어보세요..."
                className={`w-full bg-aurora-surface/40 border border-aurora-border focus:border-aurora-cyan focus:ring-1 focus:ring-aurora-cyan/50 rounded-2xl p-4 text-slate-200 text-sm placeholder-slate-500 focus:outline-none transition-all resize-none font-mono leading-relaxed ${
                  activeTab === 'split' ? 'w-1/2 mr-3' : 'w-full'
                }`}
                rows={12}
              />
            )}

            {activeTab !== 'write' && (
              <div
                className={`bg-aurora-bg/50 border border-aurora-border rounded-2xl p-4 overflow-y-auto prose prose-invert max-w-none text-sm leading-relaxed text-slate-200 ${
                  activeTab === 'split' ? 'w-1/2 ml-3' : 'w-full'
                }`}
              >
                {content.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-500 italic text-xs">
                    본문 내용을 입력하면 여기에 실시간으로 렌더링됩니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">태그:</span>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-aurora-surface border border-aurora-border text-xs text-aurora-cyan flex items-center space-x-1"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
                placeholder="태그 입력 후 Enter..."
                className="bg-aurora-surface/40 border border-aurora-border focus:border-aurora-cyan rounded-full px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

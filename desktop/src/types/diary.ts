export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: string;
  tags: string[];
  image_path?: string;
  updated_at: string;
}

export type MoodType = '😊' | '🎉' | '✨' | '💭' | '😴' | '🔥' | '😭' | '☕';

export const MOOD_OPTIONS: { emoji: MoodType; label: string; color: string }[] = [
  { emoji: '😊', label: '행복/평온', color: 'from-cyan-400 to-blue-500' },
  { emoji: '🎉', label: '신남/축하', color: 'from-pink-500 to-rose-400' },
  { emoji: '✨', label: '영감/설렘', color: 'from-purple-400 to-pink-500' },
  { emoji: '🔥', label: '열정/몰입', color: 'from-amber-400 to-orange-500' },
  { emoji: '☕', label: '여유/휴식', color: 'from-emerald-400 to-teal-500' },
  { emoji: '💭', label: '고민/생각', color: 'from-indigo-400 to-purple-600' },
  { emoji: '😴', label: '피곤/지침', color: 'from-slate-400 to-zinc-500' },
  { emoji: '😭', label: '슬픔/우울', color: 'from-blue-500 to-indigo-600' },
];

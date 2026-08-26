export interface Profile {
  id: string;
  full_name: string | null;
  college: string | null;
  department: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export type NoteStyle = 'short' | 'detailed' | 'bullets' | 'exam';

export type QuizType = 'mcq' | 'truefalse' | 'fillblank' | 'shortanswer' | 'scenario';

export interface QuizQuestion {
  type: QuizType;
  question: string;
  options?: string[];
  answer: number | string | boolean;
  explanation?: string;
}

export interface ExamPrep {
  twoMark: string[];
  fiveMark: string[];
  tenMark: string[];
  theory: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  diagrams: string[];
  tips: string[];
}

export interface NoteContent {
  completeNotes?: string;
  keyPoints?: string[];
  definitions?: { term: string; definition: string }[];
  formulas?: string[];
  dates?: { date: string; event: string }[];
  examples?: string[];
  faqs?: { question: string; answer: string }[];
  quiz?: QuizQuestion[];
  examPrep?: ExamPrep;
  flashcards?: { front: string; back: string }[];
  summary?: string;
  actionItems?: string[];
  editorHtml?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  tags: string[];
  content: NoteContent;
  raw_text: string | null;
  style: NoteStyle;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type LectureSource = 'recording' | 'upload';
export type LectureStatus = 'processing' | 'completed' | 'failed';

export interface Lecture {
  id: string;
  user_id: string;
  file_name: string | null;
  subject: string | null;
  duration_seconds: number;
  source_type: LectureSource;
  status: LectureStatus;
  transcript: string | null;
  note_id: string | null;
  recorded_at: string;
  created_at: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  fontScale: 'sm' | 'md' | 'lg';
  notifications: boolean;
  language: string;
  aiStyle: 'concise' | 'balanced' | 'detailed';
  privacy: {
    publicProfile: boolean;
    shareAnalytics: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontScale: 'md',
  notifications: true,
  language: 'English',
  aiStyle: 'balanced',
  privacy: { publicProfile: false, shareAnalytics: false },
};

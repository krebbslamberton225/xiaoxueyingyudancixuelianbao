export interface Word {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  category: string;
  grade: number;
  version: 'bj' | 'pep' | 'wy' | 'sh_ox'; // bj: 北京版, pep: 人教PEP版, wy: 外研三起版, sh_ox: 上海牛津版
  emoji: string;
  example: string;
  exampleTranslation: string;
  phonics?: string;      // segment layout like "b-oo-k"
  phonicsRule?: string;  // rules like "oo组合发短元音/ʊ/"
  spokenPhonics?: string; // custom spoken script for SpeechSynthesis
}

export interface WrongWordRecord {
  wordId: string;
  grade: number;
  category: string;
  addedAt: string;
  errorCount: number;
  lastTestedAt?: string;
  notes?: string;
}

export interface StudyStats {
  learnedWordIds: string[];
  stars: number;
  dailyStreak: number;
  lastStudyDate?: string;
  quizCount: number;
  correctAnswers: number;
  dailyWordGoal?: number; // 每日打卡单词目标
  todayWordsLearned?: string[]; // 今日已学单词ID列表
  checkedInDates?: string[]; // 已打卡的日期列表 (YYYY-MM-DD)
}

export type ActiveTab = 'learn' | 'speed' | 'audio' | 'dictation' | 'practice' | 'wrong-words' | 'stats' | 'team' | 'scenarios';

export interface PracticeQuestion {
  word: Word;
  type: 'listening' | 'spelling' | 'meaning';
  options: string[]; // for multiple choice
  correctAnswer: string;
}

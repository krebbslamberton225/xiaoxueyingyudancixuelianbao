import React, { useState, useEffect, useMemo } from 'react';
import { Word, WrongWordRecord, StudyStats, ActiveTab } from './types';
import { VOCABULARY, GRADES, EDITIONS } from './data/vocabulary';
import WordCard from './components/WordCard';
import PracticeZone from './components/PracticeZone';
import WrongWordsBook from './components/WrongWordsBook';
import StatsDashboard from './components/StatsDashboard';
import DailyCheckIn from './components/DailyCheckIn';
import SpeedReview from './components/SpeedReview';
import PortableAudio from './components/PortableAudio';
import WordDictation from './components/WordDictation';
import TeamReview from './components/TeamReview';
import WordScenarios from './components/WordScenarios';
import { 
  Flame, 
  Star, 
  BookOpen, 
  Sparkles, 
  Award, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Compass, 
  Volume2, 
  GraduationCap,
  Zap,
  Music,
  FileEdit,
  Users,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('learn');
  const [currentGrade, setCurrentGrade] = useState<number>(1);
  const [currentEdition, setCurrentEdition] = useState<'bj' | 'pep' | 'wy' | 'sh_ox'>(() => {
    const saved = localStorage.getItem('primary_english_edition');
    return (saved as any) || 'bj';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('primary_english_edition', currentEdition);
  }, [currentEdition]);

  // --- PERSISTENCE STATE ---
  const [stats, setStats] = useState<StudyStats>(() => {
    const saved = localStorage.getItem('primary_english_stats_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verify structure
        if (parsed && Array.isArray(parsed.learnedWordIds)) {
          return {
            ...parsed,
            dailyWordGoal: parsed.dailyWordGoal || 5,
            todayWordsLearned: parsed.todayWordsLearned || [],
            checkedInDates: parsed.checkedInDates || [],
          };
        }
      } catch (e) {
        console.error('Failed to parse stats:', e);
      }
    }
    // Default starter stats
    return {
      learnedWordIds: [],
      stars: 10, // Start with 10 gold stars as an initial booster!
      dailyStreak: 1,
      lastStudyDate: new Date().toISOString().split('T')[0],
      quizCount: 0,
      correctAnswers: 0,
      dailyWordGoal: 5,
      todayWordsLearned: [],
      checkedInDates: [],
    };
  });

  const [wrongRecords, setWrongRecords] = useState<WrongWordRecord[]>(() => {
    const saved = localStorage.getItem('primary_english_wrong_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse wrong words:', e);
      }
    }
    return [];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('primary_english_stats_v2', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('primary_english_wrong_v2', JSON.stringify(wrongRecords));
  }, [wrongRecords]);

  // Check and update study streak daily
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (stats.lastStudyDate !== todayStr) {
      setStats(prev => {
        let newStreak = prev.dailyStreak;
        if (!prev.lastStudyDate) {
          newStreak = 1;
        } else {
          const lastDate = new Date(prev.lastStudyDate);
          const todayDate = new Date(todayStr);
          const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1; // Consecutive day!
          } else if (diffDays > 1) {
            newStreak = 1; // Streak broken, restart
          }
        }
        return {
          ...prev,
          dailyStreak: newStreak,
          lastStudyDate: todayStr,
          todayWordsLearned: [], // New day, reset daily studied progress
        };
      });
    }
  }, []);

  // --- STATS UTILITIES ---
  const handleAddStars = (amount: number) => {
    setStats(prev => ({
      ...prev,
      stars: prev.stars + amount
    }));
  };

  const handleSetGoal = (goal: number) => {
    setStats(prev => ({
      ...prev,
      dailyWordGoal: goal
    }));
  };

  const handlePunchIn = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const dates = prev.checkedInDates || [];
      if (dates.includes(todayStr)) return prev;
      return {
        ...prev,
        checkedInDates: [...dates, todayStr],
        stars: prev.stars + 10, // Reward 10 stars for punching in!
      };
    });
  };

  const handleWordStudiedToday = (wordId: string) => {
    setStats(prev => {
      const todayWords = prev.todayWordsLearned || [];
      if (todayWords.includes(wordId)) return prev;
      return {
        ...prev,
        todayWordsLearned: [...todayWords, wordId]
      };
    });
  };

  const handleMarkAsLearned = (wordId: string) => {
    setStats(prev => {
      const learnedWordIds = prev.learnedWordIds.includes(wordId)
        ? prev.learnedWordIds
        : [...prev.learnedWordIds, wordId];
      
      const todayWords = prev.todayWordsLearned || [];
      const todayWordsLearned = todayWords.includes(wordId)
        ? todayWords
        : [...todayWords, wordId];

      return {
        ...prev,
        learnedWordIds,
        todayWordsLearned
      };
    });
  };

  const handleAddWrongWord = (wordId: string) => {
    setWrongRecords(prev => {
      const existing = prev.find(rec => rec.wordId === wordId);
      const matchedWord = VOCABULARY.find(w => w.id === wordId);
      if (!matchedWord) return prev;

      if (existing) {
        return prev.map(rec => 
          rec.wordId === wordId 
            ? { ...rec, errorCount: rec.errorCount + 1, lastTestedAt: new Date().toISOString() }
            : rec
        );
      } else {
        return [
          ...prev,
          {
            wordId,
            grade: matchedWord.grade,
            category: matchedWord.category,
            addedAt: new Date().toISOString(),
            errorCount: 1,
            lastTestedAt: new Date().toISOString()
          }
        ];
      }
    });
  };

  const handleRemoveWrongWord = (wordId: string) => {
    setWrongRecords(prev => prev.filter(rec => rec.wordId !== wordId));
  };

  const handleToggleWrongWord = (wordId: string) => {
    const isWrong = wrongRecords.some(r => r.wordId === wordId);
    if (isWrong) {
      handleRemoveWrongWord(wordId);
    } else {
      handleAddWrongWord(wordId);
    }
  };

  const handleIncrementQuizStats = (isCorrect: boolean) => {
    setStats(prev => ({
      ...prev,
      quizCount: prev.quizCount + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));
  };

  const handleResetAllData = () => {
    localStorage.removeItem('primary_english_stats_v2');
    localStorage.removeItem('primary_english_wrong_v2');
    setStats({
      learnedWordIds: [],
      stars: 10,
      dailyStreak: 1,
      lastStudyDate: new Date().toISOString().split('T')[0],
      quizCount: 0,
      correctAnswers: 0,
      dailyWordGoal: 5,
      todayWordsLearned: [],
      checkedInDates: [],
    });
    setWrongRecords([]);
    setActiveTab('learn');
    setCurrentGrade(1);
    setSelectedCategory('all');
    setSelectedWordIndex(0);
  };

  // --- FILTERED VOCABULARY FOR CURRENT LEARNING TAB ---
  const currentGradeWords = useMemo(() => {
    return VOCABULARY.filter(w => w.grade === currentGrade && w.version === currentEdition);
  }, [currentGrade, currentEdition]);

  const availableCategories = useMemo(() => {
    const cats = currentGradeWords.map(w => w.category);
    return ['all', ...Array.from(new Set(cats))];
  }, [currentGradeWords]);

  const filteredWords = useMemo(() => {
    let result = currentGradeWords;
    if (selectedCategory !== 'all') {
      result = result.filter(w => w.category === selectedCategory);
    }
    return result;
  }, [currentGradeWords, selectedCategory]);

  // Handle safe index resetting on filter change
  useEffect(() => {
    setSelectedWordIndex(0);
  }, [currentGrade, selectedCategory, currentEdition]);

  const activeWord = filteredWords[selectedWordIndex] || null;

  const handlePrevWord = () => {
    if (selectedWordIndex > 0) {
      setSelectedWordIndex(prev => prev - 1);
    }
  };

  const handleNextWord = () => {
    if (selectedWordIndex < filteredWords.length - 1) {
      setSelectedWordIndex(prev => prev + 1);
    }
  };

  // Speaks pronunciation helper
  const speakTranslation = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12 antialiased">
      {/* Top Header & Fun Mascot Banner */}
      <header className="bg-white border-b-3 border-emerald-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo and Title with textbook dropdown */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2.5 rounded-2xl text-white shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-wide flex items-center gap-1.5">
                  小学英语单词学练宝
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide">
                  PRIMARY ENGLISH VOCABULARY COMPANION
                </p>
              </div>
            </div>

            {/* Version Select Dropdown */}
            <div className="relative">
              <select
                value={currentEdition}
                onChange={(e) => {
                  setCurrentEdition(e.target.value as any);
                  setSelectedCategory('all');
                  setSelectedWordIndex(0);
                }}
                className="bg-emerald-50 hover:bg-emerald-100/80 border-2 border-emerald-200 text-emerald-800 font-black text-xs px-3 py-1.5 rounded-xl cursor-pointer shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {EDITIONS.map(ed => (
                  <option key={ed.id} value={ed.id}>
                    📖 {ed.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User gamified state stats */}
          <div className="flex items-center gap-3.5">
            {/* Daily Streak */}
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 px-3.5 py-1.5 rounded-2xl shadow-sm">
              <Flame className="w-4 h-4 fill-orange-500 stroke-none animate-pulse" />
              <div className="text-left leading-none">
                <span className="font-extrabold text-sm block font-mono">{stats.dailyStreak} 天</span>
                <span className="text-[9px] text-orange-500/80 font-bold">每日连击</span>
              </div>
            </div>

            {/* Stars Count */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-600 px-3.5 py-1.5 rounded-2xl shadow-sm">
              <Star className="w-4 h-4 fill-amber-400 stroke-none animate-bounce" />
              <div className="text-left leading-none">
                <span className="font-extrabold text-sm block font-mono">{stats.stars}</span>
                <span className="text-[9px] text-amber-500/80 font-bold">学习之星</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white border-2 border-slate-100 p-2 rounded-3xl shadow-sm space-y-2">
          {/* Row 1: Core Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => setActiveTab('learn')}
              className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'learn'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              单词学习
            </button>
            
            <button
              onClick={() => setActiveTab('practice')}
              className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              趣味闯关
            </button>

            <button
              onClick={() => setActiveTab('wrong-words')}
              className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
                activeTab === 'wrong-words'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              错词宝典
              {wrongRecords.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white ring-1 ring-rose-300">
                  {wrongRecords.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              学习报告
            </button>
          </div>

          {/* Row 2: Special Mode Swappers */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('speed')}
              className={`py-2.5 px-1 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'speed'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-400 group-hover:text-white" />
              极速刷词
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`py-2.5 px-1 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'audio'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
              随身听
            </button>

            <button
              onClick={() => setActiveTab('dictation')}
              className={`py-2.5 px-1 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'dictation'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-sky-400 group-hover:text-white" />
              单词听写
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`py-2.5 px-1 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-orange-400 group-hover:text-white" />
              组队刷词
            </button>

            <button
              onClick={() => setActiveTab('scenarios')}
              className={`py-2.5 px-1 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-1 ${
                activeTab === 'scenarios'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
              单词情境
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Workspace */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: WORD LEARNING */}
          {activeTab === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <DailyCheckIn
                stats={stats}
                onSetGoal={handleSetGoal}
                onPunchIn={handlePunchIn}
              />

              {/* Grade Sub Navigation */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 mb-3 text-center sm:text-left">
                  🌟 请选择年级 (Grades):
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {GRADES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setCurrentGrade(g.id);
                        setSelectedCategory('all');
                      }}
                      className={`py-3.5 px-2 rounded-2xl text-sm font-black flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${
                        currentGrade === g.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm scale-[1.03]'
                          : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-black">Grade {g.id}</span>
                      <span className="text-[10px] font-bold opacity-80">{g.label}</span>
                    </button>
                  ))}
                </div>

                {/* Category selectors under current grade */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5 justify-center sm:justify-start items-center">
                  <span className="text-xs font-bold text-slate-400 mr-2">
                    主题分类:
                  </span>
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      {cat === 'all' ? '全部单词' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master word card swiper */}
              {activeWord ? (
                <div className="space-y-6">
                  {/* Swiper slider board */}
                  <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                    {/* Left arrow */}
                    <button
                      disabled={selectedWordIndex === 0}
                      onClick={handlePrevWord}
                      className={`p-3.5 rounded-full border-2 bg-white shadow-sm transition-all flex items-center justify-center cursor-pointer ${
                        selectedWordIndex === 0
                          ? 'opacity-30 border-slate-100 text-slate-300 cursor-default'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95'
                      }`}
                    >
                      <ChevronLeft className="w-6 h-6 stroke-[3px]" />
                    </button>

                    {/* Word Card wrapper */}
                    <div className="flex-1 min-w-0">
                      <WordCard
                        word={activeWord}
                        isWrong={wrongRecords.some(r => r.wordId === activeWord.id)}
                        onToggleWrong={handleToggleWrongWord}
                        onLearned={handleMarkAsLearned}
                        isLearned={stats.learnedWordIds.includes(activeWord.id)}
                        onAddStars={handleAddStars}
                        onWordStudied={handleWordStudiedToday}
                      />
                    </div>

                    {/* Right arrow */}
                    <button
                      disabled={selectedWordIndex === filteredWords.length - 1}
                      onClick={handleNextWord}
                      className={`p-3.5 rounded-full border-2 bg-white shadow-sm transition-all flex items-center justify-center cursor-pointer ${
                        selectedWordIndex === filteredWords.length - 1
                          ? 'opacity-30 border-slate-100 text-slate-300 cursor-default'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95'
                      }`}
                    >
                      <ChevronRight className="w-6 h-6 stroke-[3px]" />
                    </button>
                  </div>

                  {/* Bubble game-map progress grid */}
                  <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm max-w-4xl mx-auto">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        单词卡地图 ({selectedWordIndex + 1} / {filteredWords.length})
                      </h3>
                      <p className="text-xs font-bold text-slate-400">
                        点击下方词汇泡泡，直接切换
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                      {filteredWords.map((item, idx) => {
                        const isSelected = idx === selectedWordIndex;
                        const isItemLearned = stats.learnedWordIds.includes(item.id);
                        const isItemWrong = wrongRecords.some(r => r.wordId === item.id);

                        let bubbleStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
                        if (isSelected) {
                          bubbleStyle = "bg-emerald-500 border-emerald-600 text-white font-black scale-[1.02] shadow-md ring-3 ring-emerald-100";
                        } else if (isItemLearned) {
                          bubbleStyle = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold";
                        } else if (isItemWrong) {
                          bubbleStyle = "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100";
                        }

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedWordIndex(idx)}
                            className={`py-3 px-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${bubbleStyle}`}
                          >
                            <span className="text-xl select-none">{item.emoji}</span>
                            <span className="text-xs font-extrabold truncate max-w-full font-mono">{item.word}</span>
                            
                            <div className="flex gap-1 mt-1 justify-center items-center">
                              {isItemLearned && <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded">已学会</span>}
                              {isItemWrong && <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1 py-0.2 rounded">错词</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-md mx-auto shadow-md">
                  <p className="text-slate-400 font-bold">没有在该主题下找到单词哦。</p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE QUIZ ZONE */}
          {activeTab === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PracticeZone
                currentGrade={currentGrade}
                currentEdition={currentEdition}
                onAddWrongWord={handleAddWrongWord}
                onAddStars={handleAddStars}
                onIncrementQuizStats={handleIncrementQuizStats}
              />
            </motion.div>
          )}

          {/* TAB: SPEED REVIEW (极速刷词) */}
          {activeTab === 'speed' && (
            <motion.div
              key="speed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SpeedReview
                words={filteredWords}
                onAddStars={handleAddStars}
                onAddWrongWord={handleAddWrongWord}
                onMarkAsLearned={handleMarkAsLearned}
                learnedWordIds={stats.learnedWordIds}
              />
            </motion.div>
          )}

          {/* TAB: PORTABLE AUDIO (随身听) */}
          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PortableAudio
                words={filteredWords}
              />
            </motion.div>
          )}

          {/* TAB: WORD DICTATION (单词听写) */}
          {activeTab === 'dictation' && (
            <motion.div
              key="dictation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <WordDictation
                words={filteredWords}
                onAddStars={handleAddStars}
                onAddWrongWord={handleAddWrongWord}
              />
            </motion.div>
          )}

          {/* TAB: TEAM REVIEW (组队刷词) */}
          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <TeamReview
                currentGrade={currentGrade}
                currentEdition={currentEdition}
                onAddStars={handleAddStars}
              />
            </motion.div>
          )}

          {/* TAB: SCENARIOS (单词情境) */}
          {activeTab === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <WordScenarios
                currentEdition={currentEdition}
                onAddStars={handleAddStars}
              />
            </motion.div>
          )}

          {/* TAB 3: WRONG WORDS BOOK */}
          {activeTab === 'wrong-words' && (
            <motion.div
              key="wrong-words"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <WrongWordsBook
                wrongRecords={wrongRecords}
                onRemoveWrong={handleRemoveWrongWord}
                onAddStars={handleAddStars}
              />
            </motion.div>
          )}

          {/* TAB 4: STATS & PROGRESS */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <StatsDashboard
                stats={stats}
                wrongRecords={wrongRecords}
                onResetStats={handleResetAllData}
                onSetGoal={handleSetGoal}
                onPunchIn={handlePunchIn}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

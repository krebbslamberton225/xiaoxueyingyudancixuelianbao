import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Keyboard, 
  Volume2, 
  AlertCircle, 
  Zap,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpeedReviewProps {
  words: Word[];
  onAddStars: (amount: number) => void;
  onAddWrongWord: (id: string) => void;
  onMarkAsLearned: (id: string) => void;
  learnedWordIds: string[];
}

export default function SpeedReview({ 
  words, 
  onAddStars, 
  onAddWrongWord, 
  onMarkAsLearned,
  learnedWordIds 
}: SpeedReviewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(2.5); // seconds
  const [knowCount, setKnowCount] = useState(0);
  const [dontKnowCount, setDontKnowCount] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  const activeWord = words[currentIdx];

  // Speak function
  const speakWord = (wordObj: Word) => {
    if (!window.speechSynthesis || !wordObj) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordObj.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionFinished || !activeWord) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShowAnswer(prev => !prev);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'j') {
        handleResponse(true);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'f') {
        handleResponse(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, showAnswer, isSessionFinished, activeWord]);

  // Speak word on card entry
  useEffect(() => {
    if (activeWord && !isSessionFinished) {
      speakWord(activeWord);
      setShowAnswer(false);
    }
  }, [currentIdx, isSessionFinished]);

  // Handle Autoplay Logic
  useEffect(() => {
    if (isAutoPlaying && !isSessionFinished) {
      // 1. Reveal translation after half-time, or show immediately
      const revealDelay = (autoPlaySpeed * 1000) / 2;
      const revealTimer = setTimeout(() => {
        setShowAnswer(true);
      }, revealDelay);

      // 2. Go to next after full-time
      autoPlayTimer.current = setTimeout(() => {
        // Automatically classify as "learned" or just proceed
        onMarkAsLearned(activeWord.id);
        setKnowCount(c => c + 1);
        
        if (currentIdx < words.length - 1) {
          setCurrentIdx(idx => idx + 1);
        } else {
          finishSession();
        }
      }, autoPlaySpeed * 1000);

      return () => {
        clearTimeout(revealTimer);
        if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
      };
    }
  }, [isAutoPlaying, currentIdx, autoPlaySpeed, isSessionFinished]);

  const handleResponse = (knows: boolean) => {
    if (isAutoPlaying) setIsAutoPlaying(false); // pause auto when manually clicked
    
    if (knows) {
      onMarkAsLearned(activeWord.id);
      setKnowCount(prev => prev + 1);
    } else {
      onAddWrongWord(activeWord.id);
      setDontKnowCount(prev => prev + 1);
    }

    if (currentIdx < words.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = () => {
    setIsAutoPlaying(false);
    setIsSessionFinished(true);
    // Award stars based on session words studied
    const starsEarned = Math.max(1, Math.round(knowCount / 2));
    onAddStars(starsEarned);
  };

  const restartSession = () => {
    setCurrentIdx(0);
    setShowAnswer(false);
    setIsAutoPlaying(false);
    setKnowCount(0);
    setDontKnowCount(0);
    setIsSessionFinished(false);
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-12 text-center shadow-sm max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">未找到可刷单词</h3>
        <p className="text-slate-500 text-sm">请先返回“单词学习”选择其他年级或教材版本哦！</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Banner Control */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-2xl text-amber-600">
            <Zap className="w-5 h-5 fill-amber-500 stroke-none" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-sm">极速刷词 Speed Flash</h2>
            <p className="text-[10px] text-slate-400 font-bold">高频重复，建立闪电单词记忆反射</p>
          </div>
        </div>

        {/* Play/Pause control for autoplay */}
        {!isSessionFinished && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">自动播放:</span>
            <button
              onClick={() => setIsAutoPlaying(prev => !prev)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isAutoPlaying 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={isAutoPlaying ? '暂停自动播放' : '启动自动播放'}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Speed selection */}
            <select
              value={autoPlaySpeed}
              onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
              className="bg-slate-100 border-none text-slate-700 text-xs font-black rounded-xl px-2 py-1.5 focus:ring-2 focus:ring-amber-300"
            >
              <option value={1.5}>1.5秒/词</option>
              <option value={2.5}>2.5秒/词</option>
              <option value={4.0}>4.0秒/词</option>
            </select>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isSessionFinished ? (
          <motion.div
            key="active-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-6"
          >
            {/* Progress indicator */}
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400">
              <span>刷词进度 {currentIdx + 1} / {words.length}</span>
              <span className="text-emerald-500 font-black">已掌握: {knowCount}</span>
            </div>

            {/* Flashcard Component */}
            <div 
              onClick={() => {
                setShowAnswer(!showAnswer);
                speakWord(activeWord);
              }}
              className="bg-white rounded-[2rem] border-3 border-slate-100 p-8 min-h-[280px] flex flex-col justify-between items-center text-center shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden group select-none"
            >
              {/* Corner Watermark */}
              <div className="absolute top-4 left-4 bg-slate-50 text-[10px] font-bold text-slate-400 px-3 py-1 rounded-full border border-slate-100">
                Grade {activeWord.grade} · {activeWord.category}
              </div>

              {/* Pronounce Icon */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(activeWord);
                }}
                className="absolute top-4 right-4 bg-emerald-50 hover:bg-emerald-100 p-2.5 rounded-full text-emerald-600 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* Content Core */}
              <div className="my-auto space-y-4 pt-4">
                <span className="text-4xl select-all block">{activeWord.emoji}</span>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-wide font-mono group-hover:scale-105 transition-transform">
                  {activeWord.word}
                </h3>
                <p className="text-lg font-bold text-slate-400 font-mono">
                  {activeWord.phonetic}
                </p>

                {/* Phonics Segment */}
                {activeWord.phonics && (
                  <span className="inline-block bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl text-xs font-black text-amber-700 font-mono tracking-widest mt-1">
                    {activeWord.phonics}
                  </span>
                )}
              </div>

              {/* Secret Area / Flip reveal indicator */}
              <div className="w-full border-t border-dashed border-slate-100 pt-6">
                <AnimatePresence mode="wait">
                  {showAnswer ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1.5"
                    >
                      <p className="text-2xl font-black text-emerald-600">
                        {activeWord.translation}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto leading-relaxed italic">
                        "{activeWord.exampleTranslation}"
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      className="text-xs font-bold text-slate-400 tracking-wider animate-pulse"
                    >
                      💡 点击卡片翻面 或 按【空格键】揭晓释义
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleResponse(false)}
                className="bg-white hover:bg-rose-50 border-2 border-rose-100 hover:border-rose-200 text-rose-600 py-4.5 px-6 rounded-2xl font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5 stroke-[3px]" />
                记不清了 (F / ←)
              </button>

              <button
                onClick={() => handleResponse(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-4.5 px-6 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-5 h-5 stroke-[3px]" />
                我认识它 (J / →)
              </button>
            </div>

            {/* Keyboard shortcut guide */}
            <div className="bg-slate-100 rounded-2xl p-3 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold">
              <Keyboard className="w-3.5 h-3.5" />
              <span>键盘快捷键：[←] 记不清了 &nbsp;|&nbsp; [→] 我认识 &nbsp;|&nbsp; [空格/回车] 翻面卡片</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="session-finished"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 text-center shadow-md space-y-6"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-md animate-bounce">
              <Award className="w-12 h-12 stroke-[2px]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">极速刷词挑战成功！</h3>
              <p className="text-xs text-slate-400 font-bold">Words Reviewed: {words.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <span className="block text-2xl font-black text-emerald-600 font-mono">{knowCount}</span>
                <span className="text-[10px] font-bold text-emerald-500">记住了</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-center">
                <span className="block text-2xl font-black text-rose-600 font-mono">{dontKnowCount}</span>
                <span className="text-[10px] font-bold text-rose-500">需复习</span>
              </div>
            </div>

            <p className="text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl inline-block">
              🎉 勤奋奖励：+{Math.max(1, Math.round(knowCount / 2))} 颗学习之星！
            </p>

            <div className="pt-4 border-t border-slate-100 flex gap-4 justify-center">
              <button
                onClick={restartSession}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                再刷一次
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

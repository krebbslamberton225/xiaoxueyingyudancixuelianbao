import React, { useState, useEffect } from 'react';
import { Word, WrongWordRecord } from '../types';
import { VOCABULARY } from '../data/vocabulary';
import { Volume2, Check, X, Award, RotateCcw, ArrowRight, Play, Sparkles, HelpCircle, Star, Timer, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PracticeZoneProps {
  currentGrade: number;
  currentEdition: 'bj' | 'pep' | 'wy' | 'sh_ox';
  onAddWrongWord: (wordId: string) => void;
  onAddStars: (amount: number) => void;
  onIncrementQuizStats: (isCorrect: boolean) => void;
}

export default function PracticeZone({
  currentGrade,
  currentEdition,
  onAddWrongWord,
  onAddStars,
  onIncrementQuizStats,
}: PracticeZoneProps) {
  const [practiceGrade, setPracticeGrade] = useState<number>(currentGrade);
  const [isStarted, setIsStarted] = useState(false);
  
  // Game states
  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [questionType, setQuestionType] = useState<'listening' | 'meaning' | 'spelling'>('meaning');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // New settings states for difficulty levels
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [sessionStars, setSessionStars] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Spelling puzzle specific state
  const [spellingInput, setSpellingInput] = useState<string[]>([]); // Current letters entered
  const [spellingScramble, setSpellingScramble] = useState<{ letter: string; id: number; used: boolean }[]>([]);

  // Synthesize standard TTS
  const speakWord = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Sound generator
  const playSfx = (type: 'correct' | 'wrong' | 'triumph') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.1, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220.00, now); // A3
        gain.gain.setValueAtTime(0.1, now);
        osc.frequency.setValueAtTime(196.00, now + 0.15); // G3
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Triumph
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.12, now);
        osc.frequency.setValueAtTime(587.33, now + 0.1); // D5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.4); // C6
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.75);
      }
    } catch (e) {
      console.log('Audio error', e);
    }
  };

  // Keep practice grade in sync with global grade
  useEffect(() => {
    setPracticeGrade(currentGrade);
  }, [currentGrade]);

  // Handle countdown timeout for Hard Mode
  const handleTimeout = () => {
    if (isAnswered) return;
    setIsTimerRunning(false);
    setIsAnswered(true);
    playSfx('wrong');
    const currentQuestion = questions[currentIndex];
    onIncrementQuizStats(false);
    onAddWrongWord(currentQuestion.id);
  };

  // Countdown timer effect
  useEffect(() => {
    if (!isStarted || showSummary || !isTimerRunning || isAnswered) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, showSummary, isTimerRunning, isAnswered, timeLeft]);

  // Start a new practice round
  const startPractice = () => {
    // Filter words belonging to chosen grade and edition
    const gradeWords = VOCABULARY.filter(w => w.grade === practiceGrade && w.version === currentEdition);
    if (gradeWords.length === 0) return;

    // Pick 5 random words for the session
    const shuffled = [...gradeWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, shuffled.length));

    setQuestions(selected);
    setCurrentIndex(0);
    setSessionScore(0);
    setSessionStars(0);
    setShowSummary(false);
    setIsStarted(true);
    setupQuestion(selected[0]);
  };

  // Setup options/puzzles for a single question
  const setupQuestion = (word: Word) => {
    setSelectedOption(null);
    setIsAnswered(false);

    // Randomize quiz types based on difficulty
    let selectedType: 'listening' | 'meaning' | 'spelling' = 'meaning';
    if (difficulty === 'easy') {
      const types: ('listening' | 'meaning')[] = ['meaning', 'listening'];
      selectedType = types[Math.floor(Math.random() * types.length)];
    } else if (difficulty === 'hard') {
      const types: ('listening' | 'spelling')[] = ['listening', 'spelling', 'spelling'];
      selectedType = types[Math.floor(Math.random() * types.length)];
    } else {
      const types: ('listening' | 'meaning' | 'spelling')[] = ['meaning', 'listening', 'spelling'];
      selectedType = types[Math.floor(Math.random() * types.length)];
    }
    setQuestionType(selectedType);

    if (difficulty === 'hard') {
      setTimeLeft(15);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }

    if (selectedType === 'listening' || selectedType === 'meaning') {
      // Create translation options from same edition
      const editionWords = VOCABULARY.filter(w => w.version === currentEdition);
      const translations = Array.from(new Set(editionWords.map(w => w.translation)))
        .filter(t => t !== word.translation);
      
      const distractorsCount = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;
      const shuffledOptions = [...translations].sort(() => 0.5 - Math.random()).slice(0, distractorsCount);
      shuffledOptions.push(word.translation);
      // Shuffle options list
      setOptions(shuffledOptions.sort(() => 0.5 - Math.random()));

      if (selectedType === 'listening') {
        // Automatically speak word
        setTimeout(() => speakWord(word.word), 400);
      }
    } else {
      // Spelling type
      setSpellingInput(Array(word.word.length).fill(''));
      
      // Create scrambled letters list (the word's letters + some random vowels/consonants to make poolSize total)
      const wordLetters = word.word.split('');
      const poolSize = difficulty === 'hard' ? 12 : 8;
      const extras = 'abcdefghijklmnopqrstuvwxyz'.split('')
        .filter(l => !wordLetters.includes(l))
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.max(2, poolSize - wordLetters.length));

      const scrambled = [...wordLetters, ...extras]
        .sort(() => 0.5 - Math.random())
        .map((letter, index) => ({
          letter,
          id: index,
          used: false
        }));

      setSpellingScramble(scrambled);
    }
  };

  // Trigger setup when question index changes
  useEffect(() => {
    if (isStarted && questions.length > 0 && currentIndex < questions.length) {
      setupQuestion(questions[currentIndex]);
    }
  }, [currentIndex, isStarted]);

  // Multiple Choice Selection Handler
  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    setIsTimerRunning(false); // Stop countdown timer
    const currentQuestion = questions[currentIndex];
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.translation;
    onIncrementQuizStats(isCorrect);

    if (isCorrect) {
      setSessionScore(prev => prev + 1);
      const starReward = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 5 : 3;
      setSessionStars(prev => prev + starReward);
      onAddStars(starReward);
      playSfx('correct');
    } else {
      onAddWrongWord(currentQuestion.id);
      playSfx('wrong');
    }
  };

  // Spelling Puzzle Action
  const handleLetterClick = (letterObj: { letter: string; id: number; used: boolean }) => {
    if (isAnswered || letterObj.used) return;

    // Find the first empty slot in spelling input
    const emptyIndex = spellingInput.indexOf('');
    if (emptyIndex === -1) return;

    // Mark letter as used
    setSpellingScramble(prev =>
      prev.map(item => (item.id === letterObj.id ? { ...item, used: true } : item))
    );

    // Fill spelling slot
    const newInput = [...spellingInput];
    newInput[emptyIndex] = letterObj.letter;
    setSpellingInput(newInput);

    // If input is now full, auto-check answer
    if (newInput.indexOf('') === -1) {
      checkSpelling(newInput.join(''));
    }
  };

  // Clear spelling letter
  const handleClearLetter = (index: number) => {
    if (isAnswered || spellingInput[index] === '') return;

    const letterToRemove = spellingInput[index];
    
    // Find the first matching used letter in scramble and free it
    let freed = false;
    setSpellingScramble(prev =>
      prev.map(item => {
        if (!freed && item.letter === letterToRemove && item.used) {
          freed = true;
          return { ...item, used: false };
        }
        return item;
      })
    );

    const newInput = [...spellingInput];
    newInput[index] = '';
    setSpellingInput(newInput);
  };

  const checkSpelling = (typedWord: string) => {
    if (isAnswered) return;
    setIsTimerRunning(false); // Stop countdown timer
    const currentQuestion = questions[currentIndex];
    setIsAnswered(true);

    const isCorrect = typedWord.toLowerCase() === currentQuestion.word.toLowerCase();
    onIncrementQuizStats(isCorrect);

    if (isCorrect) {
      setSessionScore(prev => prev + 1);
      const starReward = difficulty === 'hard' ? 8 : 5;
      setSessionStars(prev => prev + starReward);
      onAddStars(starReward);
      playSfx('correct');
    } else {
      onAddWrongWord(currentQuestion.id);
      playSfx('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowSummary(true);
      playSfx('triumph');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-2">
      <AnimatePresence mode="wait">
        {!isStarted ? (
          // --- WELCOME & GRADE SELECTOR ---
          <motion.div
            key="selector"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border-3 border-emerald-100 p-8 shadow-xl text-center"
          >
            <div className="text-6xl mb-4 select-none">🎮</div>
            <h2 className="text-2xl font-black text-slate-800">趣味闯关练习</h2>
            <p className="text-slate-500 font-medium text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              听发音、配译文、拼单词，根据你的水平定制挑战难度！挑战成功即可获得丰厚金星奖励！
            </p>

            {/* Difficulty Settings selector */}
            <div className="my-6 border-t border-dashed border-slate-100 pt-5">
              <span className="text-xs font-bold text-slate-400 block mb-3">
                选择闯关难度 (Difficulty Level)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDifficulty('easy')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                    difficulty === 'easy'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">🟢</span>
                  <span className="text-sm font-black">简单模式</span>
                  <span className="text-[10px] text-slate-400 font-bold leading-tight">看词选意/听音 • 3选项 • 无拼写</span>
                  <span className="text-[10px] text-amber-500 font-bold mt-1 bg-amber-50 px-1.5 py-0.5 rounded-lg">答对 +2 ⭐</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDifficulty('medium')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                    difficulty === 'medium'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">🟡</span>
                  <span className="text-sm font-black">普通模式</span>
                  <span className="text-[10px] text-slate-400 font-bold leading-tight">全类型题库 • 4选项 • 基础拼写</span>
                  <span className="text-[10px] text-amber-500 font-bold mt-1 bg-amber-50 px-1.5 py-0.5 rounded-lg">答对 +3/+5 ⭐</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDifficulty('hard')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                    difficulty === 'hard'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">🔴</span>
                  <span className="text-sm font-black">困难模式</span>
                  <span className="text-[10px] text-slate-400 font-bold leading-tight">听音/盲拼 • 5选项 • 15秒倒计时</span>
                  <span className="text-[10px] text-amber-500 font-bold mt-1 bg-amber-50 px-1.5 py-0.5 rounded-lg">答对 +5/+8 ⭐</span>
                </button>
              </div>
            </div>

            <div className="my-6 border-b border-dashed border-slate-100 pb-5">
              <span className="text-xs font-bold text-slate-400 block mb-3">
                选择闯关词汇年级
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <button
                    key={g}
                    onClick={() => setPracticeGrade(g)}
                    className={`py-3 rounded-2xl font-black text-sm transition-all border-2 cursor-pointer ${
                      practiceGrade === g
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {g}年级
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startPractice}
              className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-black py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-base"
            >
              开启英语闯关 🚀
            </button>
          </motion.div>
        ) : showSummary ? (
          // --- CONGRATULATIONS SUMMARY ---
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border-3 border-emerald-100 p-8 shadow-xl text-center"
          >
            <div className="text-6xl mb-4 select-none animate-bounce">🏆</div>
            <h2 className="text-2xl font-black text-slate-800">闯关挑战大成功！</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              小学{practiceGrade}年级 • {difficulty === 'easy' ? '🟢 简单' : difficulty === 'hard' ? '🔴 困难' : '🟡 普通'} • 闯关成绩单
            </p>

            <div className="my-8 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6 max-w-sm mx-auto shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center border-r border-emerald-100">
                  <p className="text-xs text-slate-500 font-bold">答对题数</p>
                  <p className="text-4xl font-black text-emerald-600 font-mono mt-1.5">
                    {sessionScore} <span className="text-sm font-bold">/ 5</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-bold">获得金星</p>
                  <p className="text-4xl font-black text-amber-500 font-mono mt-1.5 flex items-center justify-center gap-0.5 animate-pulse">
                    +{sessionStars} <span className="text-lg">⭐</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed font-medium">
              答错的词已悄悄放入您的【错词宝典】。可以随时使用消消乐将它们“消灭”掉哦！
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsStarted(false)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                重选难度/年级
              </button>
              <button
                onClick={startPractice}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                再闯一次
              </button>
            </div>
          </motion.div>
        ) : (
          // --- ACTIVE GAMEPLAY SCREEN ---
          <motion.div
            key="gameplay"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border-3 border-emerald-100 shadow-xl overflow-hidden"
          >
            {/* Round progress bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  {questionType === 'meaning' && '🎯 看词选意'}
                  {questionType === 'listening' && '🎧 听音辨词'}
                  {questionType === 'spelling' && '✏️ 拼写小能手'}
                  
                  {/* Difficulty Badge */}
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                    difficulty === 'hard' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '普通'}
                  </span>
                </span>
              </div>

              {/* Countdown timer */}
              {difficulty === 'hard' && !isAnswered && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black font-mono transition-colors ${
                  timeLeft <= 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Timer className={`w-3.5 h-3.5 text-rose-500 ${timeLeft <= 5 ? 'animate-bounce' : 'animate-spin'}`} />
                  <span>倒计时: {timeLeft}s</span>
                </div>
              )}

              <span className="text-xs font-mono font-bold text-slate-400">
                答对数: {sessionScore} | 进度: {currentIndex + 1} / 5
              </span>
            </div>

            <div className="h-2 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
              />
            </div>

            <div className="p-8">
              {/* Meaning and Listening interface */}
              {(questionType === 'meaning' || questionType === 'listening') && (
                <div>
                  <div className="text-center mb-8">
                    {questionType === 'meaning' ? (
                      <>
                        <span className="text-6xl mb-3 block select-none">
                          {questions[currentIndex].emoji}
                        </span>
                        <h3 className="text-3xl font-black text-slate-800 tracking-wide font-sans">
                          {questions[currentIndex].word}
                        </h3>
                        <p className="text-slate-400 font-mono text-sm mt-1">
                          {questions[currentIndex].phonetic}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-6 inline-block mb-4">
                          <HelpCircle className="w-12 h-12 text-emerald-500 animate-pulse mx-auto" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">
                          仔细倾听，选出正确含义
                        </h3>
                        <button
                          onClick={() => speakWord(questions[currentIndex].word)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-full inline-flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          重播语音
                        </button>
                      </>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {options.map((opt, oIdx) => {
                      const isCorrectOpt = opt === questions[currentIndex].translation;
                      const isSelected = selectedOption === opt;
                      
                      let btnStyle = "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700";
                      let iconEl = null;

                      if (isAnswered) {
                        if (isCorrectOpt) {
                          btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300";
                          iconEl = <Check className="w-5 h-5 stroke-[3px]" />;
                        } else if (isSelected) {
                          btnStyle = "bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-300";
                          iconEl = <X className="w-5 h-5 stroke-[3px]" />;
                        } else {
                          btnStyle = "opacity-50 border-slate-100 text-slate-400";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isAnswered}
                          onClick={() => handleAnswerSelect(opt)}
                          className={`w-full py-4 px-6 rounded-2xl border-2 text-left font-bold text-base transition-all flex justify-between items-center cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {iconEl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spelling Puzzle interface */}
              {questionType === 'spelling' && (
                <div>
                  <div className="text-center mb-6">
                    <span className="text-6xl mb-2 block select-none">
                      {questions[currentIndex].emoji}
                    </span>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-2 inline-block">
                      <p className="text-lg font-black text-slate-700">
                        {questions[currentIndex].translation}
                      </p>
                    </div>
                    <p className="text-slate-400 font-mono text-xs mt-1">
                      提示音标: {questions[currentIndex].phonetic}
                    </p>
                  </div>

                  {/* Spaces Blanks for Letters */}
                  <div className="flex justify-center gap-1.5 mb-6">
                    {spellingInput.map((letter, idx) => {
                      let borderStyle = "border-slate-300 bg-slate-50/50 text-slate-700";
                      
                      if (isAnswered) {
                        const wordCorrect = questions[currentIndex].word.toLowerCase();
                        const typedWord = spellingInput.join('').toLowerCase();
                        if (typedWord === wordCorrect) {
                          borderStyle = "bg-emerald-500 border-emerald-600 text-white font-black";
                        } else {
                          borderStyle = "bg-rose-500 border-rose-600 text-white font-black";
                        }
                      } else if (letter !== '') {
                        borderStyle = "border-emerald-400 bg-emerald-50 text-emerald-700 font-black scale-105 shadow-sm";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleClearLetter(idx)}
                          className={`w-10 h-12 rounded-xl border-2 text-center text-lg uppercase font-bold flex items-center justify-center transition-all ${
                            !isAnswered && letter !== '' ? 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 cursor-pointer' : ''
                          } ${borderStyle}`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scrambled Bubble letters to click */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto mb-6">
                    {spellingScramble.map((item) => (
                      <button
                        key={item.id}
                        disabled={isAnswered || item.used}
                        onClick={() => handleLetterClick(item)}
                        className={`w-11 h-11 rounded-full text-base uppercase font-extrabold shadow-sm transition-all flex items-center justify-center border-2 ${
                          item.used
                            ? 'bg-slate-100 border-slate-100 text-transparent opacity-30 cursor-default'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 active:scale-95 cursor-pointer'
                        }`}
                      >
                        {item.letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback and Continue button */}
              {isAnswered && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 text-center border-t border-dashed border-slate-100 pt-6"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {questionType === 'spelling' ? (
                      spellingInput.join('').toLowerCase() === questions[currentIndex].word.toLowerCase() ? (
                        <p className="text-emerald-600 font-extrabold text-base">
                          拼对啦！太聪明了！🌟 (+{difficulty === 'hard' ? 8 : 5}⭐)
                        </p>
                      ) : (
                        <p className="text-rose-500 font-extrabold text-base">
                          {timeLeft === 0 && difficulty === 'hard' ? '时间到！' : '拼错啦！'}正确是：<span className="underline font-mono">{questions[currentIndex].word}</span> 📝
                        </p>
                      )
                    ) : (
                      selectedOption === questions[currentIndex].translation ? (
                        <p className="text-emerald-600 font-extrabold text-base">
                          答对啦！加把劲！✨ (+{difficulty === 'easy' ? 2 : difficulty === 'hard' ? 5 : 3}⭐)
                        </p>
                      ) : (
                        <p className="text-rose-500 font-extrabold text-base">
                          {timeLeft === 0 && difficulty === 'hard' ? '时间到！' : '答错啦！'}正确意思是：<span className="underline">{questions[currentIndex].translation}</span> 📖
                        </p>
                      )
                    )}
                  </div>

                  <button
                    onClick={handleNext}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 px-10 rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {currentIndex + 1 < questions.length ? '下一题' : '看本关总结'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

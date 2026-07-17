import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { 
  Volume2, 
  Sparkles, 
  HelpCircle, 
  Check, 
  X, 
  RotateCcw, 
  ArrowRight, 
  Award, 
  Flame, 
  Lightbulb, 
  Smile, 
  Undo2, 
  Keyboard, 
  FileEdit 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordDictationProps {
  words: Word[];
  onAddStars: (amount: number) => void;
  onAddWrongWord: (id: string) => void;
}

export default function WordDictation({ words, onAddStars, onAddWrongWord }: WordDictationProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [selectedLetterIndices, setSelectedLetterIndices] = useState<number[]>([]);
  
  // Game states
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showChineseHint, setShowChineseHint] = useState(false);
  const [showPhonicsHint, setShowPhonicsHint] = useState(false);
  
  // Session tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [results, setResults] = useState<{ word: Word; userValue: string; correct: boolean }[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const activeWord = words[currentIdx];

  // Initialize dictation item
  useEffect(() => {
    if (activeWord && !isSessionFinished) {
      setInputValue('');
      setIsAnswered(false);
      setIsCorrect(false);
      setShowChineseHint(false);
      setShowPhonicsHint(false);
      setSelectedLetterIndices([]);
      
      // Scramble letters including some extra dummy letters if word is short
      const wordLetters = activeWord.word.toLowerCase().split('');
      const alphabets = 'abcdefghijklmnopqrstuvwxyz';
      
      // Add up to 2 extra random letters for fun complexity, max 10 letters total
      while (wordLetters.length < Math.min(8, activeWord.word.length + 2)) {
        const randomChar = alphabets[Math.floor(Math.random() * 26)];
        if (!wordLetters.includes(randomChar)) {
          wordLetters.push(randomChar);
        }
      }
      
      // Shuffle
      const shuffled = wordLetters.sort(() => Math.random() - 0.5);
      setScrambledLetters(shuffled);

      // Play pronunciation on load
      setTimeout(() => {
        speakWord(activeWord.word);
      }, 400);
    }
  }, [currentIdx, isSessionFinished, activeWord]);

  const speakWord = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.75; // Clear teaching rate
    window.speechSynthesis.speak(utterance);
  };

  const speakPhonicsHint = () => {
    if (!window.speechSynthesis || !activeWord) return;
    if (activeWord.spokenPhonics) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeWord.spokenPhonics);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      speakWord(activeWord.word);
    }
    setShowPhonicsHint(true);
  };

  // Click on scrambled bubble letter
  const handleLetterBubbleClick = (char: string, index: number) => {
    if (isAnswered) return;
    
    // Toggle/Append letter
    if (selectedLetterIndices.includes(index)) {
      // Remove last letters up to this point or just pop from input
      setSelectedLetterIndices(prev => prev.filter(i => i !== index));
      setInputValue(prev => {
        const lastIdx = prev.lastIndexOf(char);
        if (lastIdx !== -1) {
          return prev.slice(0, lastIdx) + prev.slice(lastIdx + 1);
        }
        return prev;
      });
    } else {
      setSelectedLetterIndices(prev => [...prev, index]);
      setInputValue(prev => prev + char);
    }
  };

  const handleClearInput = () => {
    if (isAnswered) return;
    setInputValue('');
    setSelectedLetterIndices([]);
  };

  const handleSubmit = () => {
    if (isAnswered || !activeWord) return;

    const sanitizedInput = inputValue.trim().toLowerCase();
    const target = activeWord.word.toLowerCase();
    const correct = sanitizedInput === target;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setCorrectCount(prev => prev + 1);
      onAddStars(1); // 1 star per correct spelling
      // Joyful ding sound spoken/simulated
      const utter = new SpeechSynthesisUtterance("Correct!");
      utter.lang = 'en-US';
      utteranceSpeech(utter);
    } else {
      setWrongCount(prev => prev + 1);
      onAddWrongWord(activeWord.id);
      const utter = new SpeechSynthesisUtterance("Oops! Let's review.");
      utter.lang = 'en-US';
      utteranceSpeech(utter);
    }

    setResults(prev => [...prev, { word: activeWord, userValue: inputValue, correct }]);
  };

  const utteranceSpeech = (utter: SpeechSynthesisUtterance) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  };

  const handleNext = () => {
    if (currentIdx < words.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsSessionFinished(true);
    }
  };

  const restartSession = () => {
    setCurrentIdx(0);
    setCorrectCount(0);
    setWrongCount(0);
    setResults([]);
    setIsSessionFinished(false);
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-12 text-center shadow-sm max-w-lg mx-auto">
        <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">未找到听写词汇</h3>
        <p className="text-slate-500 text-sm">请先返回“单词学习”选择其他年级或主题，听写可以根据您当前的过滤实时变换哦！</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-2xl">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-sm">单词听写 Dictation Lab</h2>
            <p className="text-[10px] text-slate-400 font-bold">听音拼词，全面检验自然拼读与熟练度</p>
          </div>
        </div>
        
        {!isSessionFinished && (
          <span className="text-xs font-extrabold text-slate-400 font-mono bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
            进度: {currentIdx + 1}/{words.length}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isSessionFinished ? (
          <motion.div
            key="dictation-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* WORKSPACE CARD */}
            <div className="bg-white rounded-[2rem] border-3 border-slate-100 p-6 shadow-md flex flex-col items-center space-y-6 relative overflow-hidden">
              
              {/* Corner helper labels */}
              <div className="absolute top-4 left-4 flex gap-1.5">
                <span className="bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 px-2.5 py-1 rounded-full">
                  No. {currentIdx + 1}
                </span>
              </div>

              {/* Speaker Loop Center */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <button
                  onClick={() => speakWord(activeWord.word)}
                  className="w-24 h-24 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-95 group"
                >
                  <Volume2 className="w-9 h-9 fill-white stroke-none group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black tracking-widest select-none">听发音</span>
                </button>
                <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">
                  点击按钮或按键盘字母键，拼写此词
                </p>
              </div>

              {/* Input Display Area */}
              <div className="w-full max-w-sm">
                <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-1 px-3 shadow-inner">
                  <input
                    type="text"
                    disabled={isAnswered}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isAnswered ? '' : "在此键入拼写..."}
                    className="flex-1 bg-transparent border-none text-2xl font-extrabold text-slate-800 tracking-wider font-mono focus:outline-none focus:ring-0 py-2.5 placeholder-slate-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                  />
                  {inputValue && !isAnswered && (
                    <button 
                      onClick={handleClearInput}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrambled Bubble Tiles */}
              {!isAnswered && (
                <div className="w-full max-w-sm space-y-2">
                  <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest">
                    🎈 拼读泡泡（点击依次输入）:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {scrambledLetters.map((char, index) => {
                      const isSelected = selectedLetterIndices.includes(index);
                      return (
                        <button
                          key={index}
                          onClick={() => handleLetterBubbleClick(char, index)}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border-2 font-black font-mono text-base flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm scale-95'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          {char}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* HINTS SUBBAR */}
              {!isAnswered && (
                <div className="flex justify-center gap-3 w-full border-t border-dashed border-slate-100 pt-5">
                  {/* Phonics hint */}
                  <button
                    onClick={speakPhonicsHint}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                      showPhonicsHint 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    拼读线索: {showPhonicsHint ? activeWord.phonics : '?? - ??'}
                  </button>

                  {/* Chinese hint */}
                  <button
                    onClick={() => {
                      setShowChineseHint(true);
                      speakWord(activeWord.translation);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                      showChineseHint 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5 text-indigo-500" />
                    中文线索: {showChineseHint ? `${activeWord.emoji} ${activeWord.translation}` : '查看中文'}
                  </button>
                </div>
              )}

              {/* DETAILED ANSWER EVALUATION PANEL */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`w-full border-t border-dashed pt-4 flex flex-col items-center space-y-3 text-center ${
                      isCorrect ? 'border-emerald-100' : 'border-rose-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isCorrect ? <Check className="w-5 h-5 stroke-[3px]" /> : <X className="w-5 h-5 stroke-[3px]" />}
                      </div>
                      <span className={`text-lg font-black ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCorrect ? '太棒了！拼写完全正确' : '拼写错误，继续加油哦！'}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 max-w-sm w-full space-y-2">
                      {/* Standard correction display */}
                      <p className="text-xs font-bold text-slate-400">正确单词 / Correct Spelling:</p>
                      <p className="text-3xl font-black text-slate-800 tracking-wider font-mono select-all">
                        {activeWord.word}
                      </p>
                      <p className="text-xs font-bold text-emerald-600 font-mono">
                        {activeWord.phonetic} &nbsp;|&nbsp; {activeWord.translation}
                      </p>

                      {!isCorrect && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/50">
                          <p className="text-[10px] font-bold text-slate-400">你的输入:</p>
                          <p className="text-lg font-extrabold text-rose-500 font-mono line-through tracking-wider">
                            {inputValue || '(空)'}
                          </p>
                        </div>
                      )}

                      {activeWord.phonicsRule && (
                        <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg mt-2 text-left leading-relaxed">
                          💡 拼读诀窍: {activeWord.phonicsRule}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* ACTION PANEL */}
            <div className="flex gap-4">
              {!isAnswered ? (
                <button
                  disabled={!inputValue.trim()}
                  onClick={handleSubmit}
                  className={`w-full py-4.5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    inputValue.trim()
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 hover:shadow-lg'
                      : 'bg-slate-200 text-slate-400 cursor-default'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[3px]" />
                  提交拼写 Check
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-4.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  下一个单词 Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="session-results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 text-center shadow-md space-y-6"
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
              <Award className="w-9 h-9 stroke-[2px]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">单词听写完成！</h3>
              <p className="text-xs text-slate-400 font-bold">听写词库数量: {words.length}</p>
            </div>

            {/* Stats circles */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-center">
                <span className="block text-2xl font-black text-emerald-600 font-mono">{correctCount}</span>
                <span className="text-[10px] font-bold text-emerald-500">拼写正确</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl text-center">
                <span className="block text-2xl font-black text-rose-600 font-mono">{wrongCount}</span>
                <span className="text-[10px] font-bold text-rose-500">拼写错误</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl max-w-sm mx-auto text-xs font-bold text-amber-700 leading-relaxed">
              ⭐ 恭喜斩获 {correctCount} 颗学习之星！错词已全部自动归档至“错词宝典”中。
            </div>

            {/* Detailed word list correction results */}
            <div className="border-t border-slate-100 pt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              <p className="text-xs font-black text-slate-400 text-left mb-2">听写详情 Breakdown:</p>
              {results.map((res, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base select-none">{res.word.emoji}</span>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black font-mono truncate">{res.word.word}</p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">{res.word.translation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 truncate mr-1.5">
                      输入: <span className={res.correct ? 'text-emerald-600' : 'text-rose-500'}>{res.userValue || '(空)'}</span>
                    </span>
                    {res.correct ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">正确</span>
                    ) : (
                      <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">复习</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-4 justify-center">
              <button
                onClick={restartSession}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新测试
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

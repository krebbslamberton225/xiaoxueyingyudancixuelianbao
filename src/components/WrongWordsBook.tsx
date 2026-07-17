import React, { useState } from 'react';
import { Word, WrongWordRecord } from '../types';
import { VOCABULARY } from '../data/vocabulary';
import { Trash2, Volume2, Sparkles, AlertCircle, Play, Check, X, Award, RotateCcw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WrongWordsBookProps {
  wrongRecords: WrongWordRecord[];
  onRemoveWrong: (wordId: string) => void;
  onAddStars: (amount: number) => void;
}

export default function WrongWordsBook({
  wrongRecords,
  onRemoveWrong,
  onAddStars,
}: WrongWordsBookProps) {
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'clear-game'>('list');

  // Find corresponding Word objects
  const wrongWords: { word: Word; record: WrongWordRecord }[] = wrongRecords
    .map(rec => {
      const w = VOCABULARY.find(item => item.id === rec.wordId);
      return w ? { word: w, record: rec } : null;
    })
    .filter((item): item is { word: Word; record: WrongWordRecord } => item !== null);

  // Filter based on selected grade
  const filteredWrongWords = wrongWords.filter(item => {
    if (filterGrade === 'all') return true;
    return item.word.grade === filterGrade;
  });

  // Speak word
  const speakWord = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // --- "错词消消乐" GAME STATE ---
  const [gameIndex, setGameIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<number>(0);
  const [showGameSummary, setShowGameSummary] = useState<boolean>(false);
  const [gameIncorrectRecords, setGameIncorrectRecords] = useState<string[]>([]); // Track correctly answered word IDs to remove

  // Initialize/Reset the elimination game
  const startGame = () => {
    if (filteredWrongWords.length === 0) return;
    setGameIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setGameScore(0);
    setShowGameSummary(false);
    setGameIncorrectRecords([]);
  };

  // Get options for current question
  const getGameQuestionOptions = (correctWord: Word) => {
    // Pick 3 random wrong translation options from VOCABULARY that are not the correct one
    const distinctTranslations = Array.from(new Set(VOCABULARY.map(w => w.translation)))
      .filter(t => t !== correctWord.translation);
    const shuffledTranslations = [...distinctTranslations].sort(() => 0.5 - Math.random());
    const picked = shuffledTranslations.slice(0, 3);
    picked.push(correctWord.translation);
    return picked.sort(() => 0.5 - Math.random());
  };

  // Keep a stable options cache for current question
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  React.useEffect(() => {
    if (activeSubTab === 'clear-game' && filteredWrongWords.length > 0 && gameIndex < filteredWrongWords.length) {
      const currentWord = filteredWrongWords[gameIndex].word;
      setCurrentOptions(getGameQuestionOptions(currentWord));
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [gameIndex, activeSubTab, filterGrade]);

  const handleGameAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const currentItem = filteredWrongWords[gameIndex];
    const isCorrect = option === currentItem.word.translation;

    if (isCorrect) {
      setGameScore(prev => prev + 1);
      setGameIncorrectRecords(prev => [...prev, currentItem.word.id]);
    }
  };

  const nextGameQuestion = () => {
    if (gameIndex + 1 < filteredWrongWords.length) {
      setGameIndex(prev => prev + 1);
    } else {
      setShowGameSummary(true);
    }
  };

  // Apply elimination results
  const applyElimination = () => {
    gameIncorrectRecords.forEach(wordId => {
      onRemoveWrong(wordId);
    });
    // Add stars reward: 3 stars per eliminated word
    const starsReward = gameIncorrectRecords.length * 3;
    if (starsReward > 0) {
      onAddStars(starsReward);
    }
    setActiveSubTab('list');
    setShowGameSummary(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-2">
      {/* Grade Selector and Tabs */}
      <div className="bg-white rounded-3xl border-3 border-emerald-100 shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              错词宝典
            </h2>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">
              记录闯关或学习中答错的单词，帮孩子查缺补漏、重点复习
            </p>
          </div>

          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => {
                setActiveSubTab('list');
              }}
              className={`flex-1 md:flex-none px-5 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeSubTab === 'list'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              错词本列表
            </button>
            <button
              onClick={() => {
                setActiveSubTab('clear-game');
                startGame();
              }}
              disabled={filteredWrongWords.length === 0}
              className={`flex-1 md:flex-none px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                filteredWrongWords.length === 0
                  ? 'opacity-50 cursor-not-allowed text-slate-400'
                  : activeSubTab === 'clear-game'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              错词消消乐 ({filteredWrongWords.length})
            </button>
          </div>
        </div>

        {/* Grade Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">分级筛选:</span>
          <button
            onClick={() => setFilterGrade('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterGrade === 'all'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            全部年级 ({wrongWords.length})
          </button>
          {[1, 2, 3, 4, 5, 6].map(g => {
            const count = wrongWords.filter(item => item.word.grade === g).length;
            return (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterGrade === g
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {g}年级 ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main wrong words content view */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {filteredWrongWords.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 py-16 px-6 text-center shadow-md max-w-md mx-auto">
                <div className="text-6xl mb-4 select-none">🏆</div>
                <h3 className="text-xl font-extrabold text-slate-800">
                  {filterGrade === 'all' ? '太棒了，没有错词！' : `暂无${filterGrade}年级错词！`}
                </h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                  这里空空如也，说明孩子的掌握情况非常棒，继续保持哦！
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWrongWords.map(({ word, record }) => (
                  <motion.div
                    key={word.id}
                    layoutId={`wrong-card-${word.id}`}
                    className="bg-white rounded-2xl border-2 border-rose-50 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl select-none">{word.emoji}</span>
                          <div>
                            <h4 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                              {word.word}
                              <button
                                onClick={() => speakWord(word.word)}
                                className="text-emerald-500 hover:text-emerald-600 p-1 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </h4>
                            <p className="text-xs text-slate-400 font-mono font-medium">{word.phonetic}</p>
                          </div>
                        </div>

                        <span className="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                          写错 {record.errorCount} 次
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 mb-4">
                        <p className="text-sm font-bold text-slate-700">
                          释义：{word.translation}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          例句：{word.example}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {word.exampleTranslation}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed border-slate-100 pt-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        小学{word.grade}年级 • {word.category.split(' ')[0]}
                      </span>

                      <button
                        onClick={() => onRemoveWrong(word.id)}
                        className="text-slate-400 hover:text-rose-500 flex items-center gap-1 text-xs font-bold hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="移出当前错词本"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        移除错词
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="clear-game"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto"
          >
            {/* Show game play screen */}
            {!showGameSummary && filteredWrongWords.length > 0 && gameIndex < filteredWrongWords.length && (
              <div className="bg-white rounded-3xl border-3 border-rose-100 shadow-xl overflow-hidden">
                {/* Game Progress Header */}
                <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-6 py-4 flex justify-between items-center border-b border-rose-100">
                  <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    错词消消乐闯关中
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    进度：{gameIndex + 1} / {filteredWrongWords.length}
                  </span>
                </div>

                <div className="p-8">
                  {/* Current Question */}
                  <div className="text-center mb-8">
                    <span className="text-6xl mb-3 block select-none">
                      {filteredWrongWords[gameIndex].word.emoji}
                    </span>
                    <h3 className="text-3xl font-black text-slate-800 tracking-wide font-sans mb-1 select-all">
                      {filteredWrongWords[gameIndex].word.word}
                    </h3>
                    <p className="text-rose-500 font-mono text-sm font-semibold">
                      {filteredWrongWords[gameIndex].word.phonetic}
                    </p>

                    <button
                      onClick={() => speakWord(filteredWrongWords[gameIndex].word.word)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full hover:bg-emerald-100 transition-all cursor-pointer shadow-sm"
                    >
                      <Volume2 className="w-4 h-4" />
                      听发音
                    </button>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
                    {currentOptions.map((opt, oIdx) => {
                      const isCorrectOpt = opt === filteredWrongWords[gameIndex].word.translation;
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
                          onClick={() => handleGameAnswer(opt)}
                          className={`w-full py-4 px-6 rounded-2xl border-2 text-left font-bold text-base transition-all flex justify-between items-center cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {iconEl}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedbacks / Control */}
                  {isAnswered && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <p className={`text-base font-black mb-4 ${
                        selectedOption === filteredWrongWords[gameIndex].word.translation
                          ? 'text-emerald-600'
                          : 'text-rose-500'
                      }`}>
                        {selectedOption === filteredWrongWords[gameIndex].word.translation
                          ? '答对啦！这个单词将从错词本消灭哦！✨'
                          : `答错啦！正确意思是：${filteredWrongWords[gameIndex].word.translation} 🥺`}
                      </p>

                      <button
                        onClick={nextGameQuestion}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 px-8 rounded-xl shadow-md flex items-center gap-1.5 mx-auto transition-all cursor-pointer"
                      >
                        {gameIndex + 1 < filteredWrongWords.length ? '下一题' : '看结果'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Game Summary Screen */}
            {showGameSummary && (
              <div className="bg-white rounded-3xl border-3 border-emerald-100 shadow-xl p-8 text-center">
                <div className="text-6xl mb-4 select-none">🎉</div>
                <h3 className="text-2xl font-black text-slate-800">消消乐挑战完成！</h3>
                <p className="text-slate-500 font-semibold mt-1">
                  消灭错词是成为英语学霸的必经之路！
                </p>

                <div className="my-6 bg-emerald-50 rounded-2xl p-5 border border-emerald-100 max-w-xs mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center border-r border-emerald-200/50">
                      <p className="text-xs text-slate-500 font-extrabold">成功消灭</p>
                      <p className="text-3xl font-black text-emerald-600 font-mono mt-1">
                        {gameIncorrectRecords.length}
                      </p>
                      <p className="text-[10px] text-slate-400">个单词</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 font-extrabold">获得奖励</p>
                      <p className="text-3xl font-black text-amber-500 font-mono mt-1 flex items-center justify-center gap-0.5">
                        +{gameIncorrectRecords.length * 3}
                        <span className="text-sm font-bold">⭐</span>
                      </p>
                      <p className="text-[10px] text-slate-400">消灭之星</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={startGame}
                    className="bg-slate-50 border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    再试一次
                  </button>
                  <button
                    onClick={applyElimination}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm px-8 py-3 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    领奖并移除错词
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

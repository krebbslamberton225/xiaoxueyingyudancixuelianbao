import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  Settings2, 
  Music, 
  AlertCircle,
  Clock,
  ListMusic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortableAudioProps {
  words: Word[];
}

type LoopMode = 'sequence' | 'shuffle' | 'single';

export default function PortableAudio({ words }: PortableAudioProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('sequence');
  const [playbackRate, setPlaybackRate] = useState<number>(0.8); // normal/teaching rate
  const [wordInterval, setWordInterval] = useState<number>(3); // seconds between words
  
  // Audio Configs
  const [includeSpelling, setIncludeSpelling] = useState(true);
  const [includePhonics, setIncludePhonics] = useState(true);
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [includeExample, setIncludeExample] = useState(false);

  const [activeSpeechText, setActiveSpeechText] = useState<string>('');
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);

  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const intervalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeWord = words[currentIdx];

  // Reset indices if words change
  useEffect(() => {
    setCurrentIdx(0);
    setIsPlaying(false);
    setActiveSpeechText('');
    setPlayedIndices([]);
  }, [words]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (intervalTimeoutRef.current) clearTimeout(intervalTimeoutRef.current);
    };
  }, []);

  // When isPlaying or currentIdx changes, run the voice play cycle
  useEffect(() => {
    if (isPlaying && activeWord) {
      playActiveWordAudio();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (intervalTimeoutRef.current) clearTimeout(intervalTimeoutRef.current);
      setActiveSpeechText('已暂停');
    }
  }, [isPlaying, currentIdx]);

  // Generate and play current word utterances in order
  const playActiveWordAudio = () => {
    if (!window.speechSynthesis || !activeWord) return;
    
    // Cancel any active speaking
    window.speechSynthesis.cancel();
    if (intervalTimeoutRef.current) clearTimeout(intervalTimeoutRef.current);
    speechQueueRef.current = [];

    const utteranceList: SpeechSynthesisUtterance[] = [];

    // 1. Speak word itself
    const wordUtt = new SpeechSynthesisUtterance(activeWord.word);
    wordUtt.lang = 'en-US';
    wordUtt.rate = playbackRate;
    wordUtt.onstart = () => setActiveSpeechText(`正在发音: ${activeWord.word}`);
    utteranceList.push(wordUtt);

    // 2. Spell out letters (e.g., b-o-o-k)
    if (includeSpelling) {
      const letters = activeWord.word.toLowerCase().split('').join('... ');
      const spellUtt = new SpeechSynthesisUtterance(`Spelled as, ${letters}`);
      spellUtt.lang = 'en-US';
      spellUtt.rate = playbackRate;
      spellUtt.onstart = () => setActiveSpeechText(`正在拼读拼写: ${activeWord.word.toUpperCase()}`);
      utteranceList.push(spellUtt);
    }

    // 3. Phonics tutoring
    if (includePhonics && activeWord.spokenPhonics) {
      const phonicsUtt = new SpeechSynthesisUtterance(activeWord.spokenPhonics);
      phonicsUtt.lang = 'en-US';
      phonicsUtt.rate = playbackRate;
      phonicsUtt.onstart = () => setActiveSpeechText(`自然拼读教学: ${activeWord.phonics || activeWord.word}`);
      utteranceList.push(phonicsUtt);
    }

    // 4. Translation
    if (includeTranslation) {
      const transUtt = new SpeechSynthesisUtterance(activeWord.translation);
      transUtt.lang = 'zh-CN';
      transUtt.rate = playbackRate + 0.1;
      transUtt.onstart = () => setActiveSpeechText(`中文释义: ${activeWord.translation}`);
      utteranceList.push(transUtt);
    }

    // 5. Example sentence
    if (includeExample && activeWord.example) {
      const exUtt = new SpeechSynthesisUtterance(activeWord.example);
      exUtt.lang = 'en-US';
      exUtt.rate = playbackRate;
      exUtt.onstart = () => setActiveSpeechText(`例句学习: "${activeWord.example}"`);
      utteranceList.push(exUtt);
    }

    // Connect queue callbacks to move to next utterance
    for (let i = 0; i < utteranceList.length - 1; i++) {
      utteranceList[i].onend = () => {
        if (isPlaying) window.speechSynthesis.speak(utteranceList[i + 1]);
      };
    }

    // The final utterance triggers a transition to the next word after the custom delay
    const finalUtt = utteranceList[utteranceList.length - 1];
    finalUtt.onend = () => {
      if (!isPlaying) return;
      setActiveSpeechText(`稍等 ${wordInterval} 秒，准备下一个...`);
      
      intervalTimeoutRef.current = setTimeout(() => {
        handleNextTrack();
      }, wordInterval * 1000);
    };

    // Store queue ref to allow pause controls
    speechQueueRef.current = utteranceList;
    
    // Start speaking!
    window.speechSynthesis.speak(utteranceList[0]);
  };

  const handleNextTrack = () => {
    if (loopMode === 'single') {
      // Replay same word
      playActiveWordAudio();
    } else if (loopMode === 'shuffle') {
      // Pick random index
      let randomIdx = Math.floor(Math.random() * words.length);
      // Try to avoid picking the exact same unless only 1 word exists
      if (words.length > 1 && randomIdx === currentIdx) {
        randomIdx = (randomIdx + 1) % words.length;
      }
      setCurrentIdx(randomIdx);
    } else {
      // Sequence
      if (currentIdx < words.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        // Loop back to start
        setCurrentIdx(0);
      }
    }
  };

  const handlePrevTrack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    } else {
      setCurrentIdx(words.length - 1);
    }
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-12 text-center shadow-sm max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">随身听歌单为空</h3>
        <p className="text-slate-500 text-sm">当前分类下没有单词，请先选择其他教材或年级哦！</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* LEFT & CENTER PANEL: MUSIC PLAYER CORE */}
      <div className="md:col-span-2 bg-white rounded-[2rem] border-2 border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
        {/* Player Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
              <Music className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-sm">英文随身听 Portable Player</h2>
              <p className="text-[10px] text-slate-400 font-bold">闭上眼听拼读、释义和例句，随时随地听力磨耳朵</p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-xs font-black text-emerald-600 font-mono">
              Track {currentIdx + 1}/{words.length}
            </span>
          </div>
        </div>

        {/* Dynamic Spinning Audio Deck */}
        <div className="flex flex-col items-center justify-center py-6 space-y-6 relative">
          
          {/* Visual Record / Vinyl Disk */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Spinning ring outer */}
            <motion.div 
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={isPlaying ? { repeat: Infinity, duration: 10, ease: 'linear' } : {}}
              className="absolute inset-0 rounded-full border-8 border-slate-800 bg-slate-900 shadow-xl flex items-center justify-center"
            >
              {/* Retro grooves */}
              <div className="absolute inset-2 rounded-full border border-slate-700/60" />
              <div className="absolute inset-4 rounded-full border border-slate-700/40" />
              <div className="absolute inset-6 rounded-full border border-slate-700/20" />
              
              {/* Color label center */}
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-white text-3xl select-none">
                {activeWord.emoji}
              </div>
            </motion.div>
            
            {/* Spinning node indicator pin */}
            <div className="absolute top-0 right-4 w-12 h-16 origin-top bg-transparent border-l-4 border-slate-400 rounded-full transition-transform duration-500" 
                 style={{ transform: isPlaying ? 'rotate(15deg)' : 'rotate(-15deg)' }} />
          </div>

          {/* Current Word Display */}
          <div className="text-center space-y-1">
            <h3 className="text-3xl font-black text-slate-800 tracking-wide font-mono">
              {activeWord.word}
            </h3>
            <p className="text-sm font-bold text-slate-400 font-mono">
              {activeWord.phonetic} &nbsp;·&nbsp; <span className="text-emerald-500">{activeWord.translation}</span>
            </p>
          </div>

          {/* Real-time speech subtitle strip */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl py-3 px-5 text-center min-h-[50px] flex items-center justify-center max-w-sm w-full shadow-inner">
            <p className="text-xs font-black text-emerald-800 tracking-wide flex items-center gap-1.5 animate-pulse">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
              {activeSpeechText || '点击播放，开始听音记忆...'}
            </p>
          </div>
        </div>

        {/* Player Action Buttons Bar */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          
          {/* Main timeline slider style mock, representing progress */}
          <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
            />
          </div>

          {/* Buttons strip */}
          <div className="flex items-center justify-between gap-2 px-2">
            
            {/* Loop Mode Toggle */}
            <button
              onClick={() => {
                if (loopMode === 'sequence') setLoopMode('shuffle');
                else if (loopMode === 'shuffle') setLoopMode('single');
                else setLoopMode('sequence');
              }}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title={
                loopMode === 'sequence' ? '顺序循环' :
                loopMode === 'shuffle' ? '随机播放' : '单曲循环'
              }
            >
              {loopMode === 'sequence' && <Repeat className="w-5 h-5 text-emerald-500" />}
              {loopMode === 'shuffle' && <Shuffle className="w-5 h-5 text-amber-500 animate-wiggle" />}
              {loopMode === 'single' && <Repeat1 className="w-5 h-5 text-rose-500" />}
            </button>

            {/* Back button */}
            <button
              onClick={handlePrevTrack}
              className="p-3 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-5 h-5 fill-slate-600 stroke-none" />
            </button>

            {/* Master Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-white stroke-none" /> : <Play className="w-7 h-7 fill-white stroke-none ml-1" />}
            </button>

            {/* Forward button */}
            <button
              onClick={handleNextTrack}
              className="p-3 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-5 h-5 fill-slate-600 stroke-none" />
            </button>

            {/* Status indicator info */}
            <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold capitalize select-none">
              {loopMode === 'sequence' ? '顺序' : loopMode === 'shuffle' ? '随机' : '单词'}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: SETTINGS & PLAYLIST TRACKS */}
      <div className="space-y-6">
        
        {/* AUDIO SETTINGS */}
        <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 pb-2.5 border-b border-slate-50">
            <Settings2 className="w-4 h-4 text-emerald-500" />
            播讲设置 Settings
          </h3>

          {/* Config switches */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">拼读字母拼写 (s-p-e-l-l)</span>
              <input 
                type="checkbox" 
                checked={includeSpelling}
                onChange={(e) => setIncludeSpelling(e.target.checked)}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">自然拼读发音讲解</span>
              <input 
                type="checkbox" 
                checked={includePhonics}
                onChange={(e) => setIncludePhonics(e.target.checked)}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">中文词意朗读</span>
              <input 
                type="checkbox" 
                checked={includeTranslation}
                onChange={(e) => setIncludeTranslation(e.target.checked)}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer">
              <span className="text-xs font-bold text-slate-600">英文原声例句</span>
              <input 
                type="checkbox" 
                checked={includeExample}
                onChange={(e) => setIncludeExample(e.target.checked)}
                className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-50 space-y-3">
            {/* Word speed slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                <span>播音语速:</span>
                <span className="text-emerald-600 font-mono">{playbackRate}x (推荐慢速)</span>
              </div>
              <input 
                type="range" 
                min={0.5} 
                max={1.3} 
                step={0.1}
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>

            {/* Word interval input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 词间隔停顿:</span>
                <span className="text-emerald-600 font-mono">{wordInterval}秒</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={8} 
                step={1}
                value={wordInterval}
                onChange={(e) => setWordInterval(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* PLAYLIST SECTION */}
        <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-5 shadow-sm space-y-3 flex flex-col max-h-[350px]">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 pb-2.5 border-b border-slate-50 shrink-0">
            <ListMusic className="w-4 h-4 text-emerald-500" />
            播讲歌单 Tracks ({words.length})
          </h3>

          {/* Scrollable list */}
          <div className="overflow-y-auto pr-1 flex-1 space-y-1.5 custom-scrollbar scroll-smooth">
            {words.map((w, idx) => {
              const isActive = idx === currentIdx;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 scale-[1.01]' 
                      : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base select-none shrink-0">{w.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate font-mono">{w.word}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{w.translation}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded animate-pulse">
                      播放中
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

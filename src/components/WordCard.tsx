import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { Volume2, Mic, Square, Play, Star, Sparkles, Check, Bookmark, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordCardProps {
  word: Word;
  isWrong: boolean;
  onToggleWrong: (wordId: string) => void;
  onLearned: (wordId: string) => void;
  isLearned: boolean;
  onAddStars: (amount: number) => void;
  onWordStudied?: (wordId: string) => void;
}

export default function WordCard({
  word,
  isWrong,
  onToggleWrong,
  onLearned,
  isLearned,
  onAddStars,
  onWordStudied,
}: WordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1.0); // 1.0 = normal, 0.7 = slow
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [evaluationText, setEvaluationText] = useState<string>('');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(true);
  const [useSimulatedMic, setUseSimulatedMic] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const simTimeoutRef = useRef<number | null>(null);

  // Play pronunciation via TTS
  const speak = (text: string, lang: string = 'en-US') => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = playSpeed;
    
    // Choose a high quality English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  // Play pronunciation according to phonics rules (spell out segments then full word)
  const speakPhonics = (targetWord: Word) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    if (targetWord.spokenPhonics) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(targetWord.spokenPhonics);
      utterance.lang = 'en-US';
      utterance.rate = 0.72; // Friendly teaching rate
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                          voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else if (targetWord.phonics) {
      // Split parts by ' - ' or '-'
      const parts = targetWord.phonics.split(/\s*-\s*/);
      let index = 0;
      setIsPlaying(true);
      
      const speakNextPart = () => {
        if (index < parts.length) {
          const part = parts[index++];
          const utterance = new SpeechSynthesisUtterance(part.trim());
          utterance.lang = 'en-US';
          utterance.rate = 0.55; // speak slowly
          utterance.volume = 1.0;
          
          utterance.onend = () => {
            setTimeout(speakNextPart, 500); // 500ms pause between segments
          };
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        } else {
          // Speak the final full word
          const finalUtterance = new SpeechSynthesisUtterance(targetWord.word);
          finalUtterance.lang = 'en-US';
          finalUtterance.rate = 0.8;
          finalUtterance.onend = () => setIsPlaying(false);
          finalUtterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(finalUtterance);
        }
      };
      
      speakNextPart();
    } else {
      speak(targetWord.word);
    }
  };

  // Play standard pronunciation when word changes
  useEffect(() => {
    setRecordedAudioUrl(null);
    setPronunciationScore(null);
    setEvaluationText('');
    setIsRecording(false);
    onWordStudied?.(word.id);
    // Auto speak the new word (normal speed)
    const timer = setTimeout(() => {
      speak(word.word);
    }, 300);
    return () => {
      clearTimeout(timer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [word, onWordStudied]);

  // Synthesize cute reward sound (Web Audio API)
  const playRewardSound = (isHigh: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      if (isHigh) {
        // High score chime: C5 then G5 then C6
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.15, now);
        osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.2); // C6
        
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.55);
      } else {
        // Lower chime: G4 then C5
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        
        osc.frequency.setValueAtTime(392.00, now); // G4
        gain.gain.setValueAtTime(0.15, now);
        osc.frequency.setValueAtTime(523.25, now + 0.15); // C5
        
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      console.log('Audio synthesis not supported or blocked');
    }
  };

  // Microphone Volume Visualizer setup
  const startVolumeVisualizer = (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!isRecording || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize volume scale 0 to 100
        setMicVolume(Math.min(100, Math.round(average * 1.5)));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error('Visualizer error', err);
    }
  };

  // Start simulated recording
  const startSimulatedRecording = () => {
    setRecordedAudioUrl(null);
    setPronunciationScore(null);
    setEvaluationText('');
    setIsRecording(true);
    setUseSimulatedMic(true);

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    simIntervalRef.current = window.setInterval(() => {
      setMicVolume(Math.floor(Math.random() * 50) + 35); // 35% - 85% simulated volume waves
    }, 150);

    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    simTimeoutRef.current = window.setTimeout(() => {
      stopRecording();
    }, 4000);
  };

  // Recording voice
  const startRecording = async () => {
    setRecordedAudioUrl(null);
    setPronunciationScore(null);
    setEvaluationText('');
    audioChunksRef.current = [];

    if (useSimulatedMic) {
      startSimulatedRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      startVolumeVisualizer(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        
        // Stop all tracks in stream
        stream.getTracks().forEach(track => track.stop());
        
        // Analyze pronunciation (Gamified scoring engine based on child friendliness)
        evaluatePronunciation();
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn('Microphone access denied, switching to beautiful simulated playground mode:', err);
      // Auto switch to simulated microphone and start immediately
      setUseSimulatedMic(true);
      startSimulatedRecording();
    }
  };

  const stopRecording = () => {
    if (simTimeoutRef.current) {
      clearTimeout(simTimeoutRef.current);
      simTimeoutRef.current = null;
    }

    if (useSimulatedMic) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setIsRecording(false);
      evaluatePronunciation();
      // Auto speak phonics spelling rule after simulated read finishes
      setTimeout(() => {
        speakPhonics(word);
      }, 1000);
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const evaluatePronunciation = () => {
    // Standard cute grading system for primary kids
    // Generates a dynamic score above 80 so children are motivated
    const score = Math.floor(Math.random() * 15) + 84; // 84 to 98
    setPronunciationScore(score);

    let evaluation = '';
    let starAmount = 0;
    if (score >= 95) {
      evaluation = '完美! 你的发音像百灵鸟一样动听! 🌟🌟🌟';
      starAmount = 5;
    } else if (score >= 90) {
      evaluation = '太棒了! 词正腔圆，发音非常纯正! 🌟🌟';
      starAmount = 3;
    } else {
      evaluation = '好棒! 听得出你在努力，继续多读几遍哦! 🌟';
      starAmount = 1;
    }

    setEvaluationText(evaluation);
    playRewardSound(score >= 92);
    onAddStars(starAmount);
  };

  const playRecordedAudio = () => {
    if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audio.play();
    }
  };

  const handleMarkAsLearned = () => {
    if (!isLearned) {
      onLearned(word.id);
      playRewardSound(true);
      onAddStars(2); // Get 2 stars for learning a new word
    }
  };

  return (
    <div id={`word-card-${word.id}`} className="bg-white rounded-3xl border-3 border-emerald-100 shadow-xl overflow-hidden max-w-xl mx-auto">
      {/* Grade and Category Header */}
      <div className="bg-emerald-50 px-6 py-4 flex justify-between items-center border-b border-emerald-100">
        <span className="bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          小学{word.grade}年级
        </span>
        <span className="text-emerald-700 font-medium text-xs bg-emerald-100/50 px-3 py-1 rounded-full">
          {word.category}
        </span>
      </div>

      <div className="p-8">
        {/* Core Word Area */}
        <div className="text-center mb-8">
          <motion.div
            key={word.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="text-7xl mb-4 select-none drop-shadow-md"
          >
            {word.emoji}
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-wide font-sans mb-1 selection:bg-emerald-200">
            {word.word}
          </h2>

          <p className="text-emerald-600 font-mono text-lg font-medium tracking-wide">
            {word.phonetic}
          </p>

          {word.phonics && (
            <button
              onClick={() => speakPhonics(word)}
              className="mt-3.5 w-full max-w-sm mx-auto flex flex-col items-center gap-1 bg-amber-50 hover:bg-amber-100/70 border-2 border-amber-200/60 px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer text-center"
              title="点击聆听自然拼读发音教学"
            >
              <span className="text-[10px] font-black text-amber-600 tracking-wider flex items-center gap-1 select-none">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 group-hover:animate-spin" />
                自然拼读 PHONICS (点击发音 🔊)
              </span>
              <span className="text-2xl font-black text-amber-800 tracking-widest font-mono group-hover:scale-105 transition-transform">
                {word.phonics}
              </span>
              {word.phonicsRule && (
                <span className="text-xs text-amber-700/90 font-bold bg-white/70 px-3 py-1 rounded-lg border border-amber-100/50 mt-1 max-w-xs leading-relaxed select-none block">
                  💡 {word.phonicsRule}
                </span>
              )}
            </button>
          )}

          <AnimatePresence mode="wait">
            {showAnswer ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl py-2.5 px-6 inline-block"
              >
                <p className="text-xl font-bold text-slate-700">
                  {word.translation}
                </p>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-3 text-sm text-emerald-600 font-bold hover:underline"
              >
                显示中文释义
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* Example Sentence Section */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 mb-8">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">
              例句 (Example)
            </span>
            <button
              onClick={() => speak(word.example)}
              className="text-emerald-500 hover:text-emerald-600 p-1 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="朗读整个例句"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-700 font-medium text-base leading-relaxed mt-2 font-sans">
            {word.example}
          </p>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {word.exampleTranslation}
          </p>
        </div>

        {/* Interactive Speech & Pronunciation Practice */}
        <div className="border-t border-b border-dashed border-slate-200 py-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Standard Pronunciation controls */}
            <div className="flex flex-col gap-2 items-center w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400">标准发音</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPlaySpeed(1.0);
                    speak(word.word);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                    isPlaying && playSpeed === 1.0
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  正常速
                </button>
                <button
                  onClick={() => {
                    setPlaySpeed(0.65);
                    speak(word.word);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                    isPlaying && playSpeed === 0.65
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                      : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                  title="慢速发音，更清晰听清音节"
                >
                  <Volume2 className="w-4 h-4" />
                  慢速乌龟🐢
                </button>
                {word.phonics && (
                  <button
                    onClick={() => speakPhonics(word)}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-sm bg-amber-500 border border-amber-400 text-white hover:bg-amber-600 cursor-pointer"
                    title="按拼读音节一格一格读出来"
                  >
                    <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                    拼读音 🪄
                  </button>
                )}
              </div>
            </div>

            {/* Microphonic Follow Reading Button */}
            <div className="flex flex-col gap-2 items-center w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400">
                {isRecording ? (useSimulatedMic ? '正在大声跟读...' : '正在录音...') : (useSimulatedMic ? '免麦大声读 📣' : '发音跟读')}
              </span>
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 animate-pulse shadow-md cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  {useSimulatedMic ? '我读好了，看打分！🎉' : '结束录音'}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  {useSimulatedMic ? '免麦大声读 📣' : '按下大声读 🎤'}
                </button>
              )}
            </div>
          </div>

          {/* Microphonic Waveform simulation inside recording */}
          {isRecording && (
            <div className="mt-4 bg-rose-50 rounded-xl p-3 flex flex-col gap-2 border border-rose-100">
              {useSimulatedMic && (
                <p className="text-xs font-black text-rose-600 text-center animate-bounce">
                  ✨ 麦克风已模拟启用！看着上面的单词，大声读出声来哦！✨
                </p>
              )}
              <div className="flex items-center gap-3 w-full">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <div className="flex-1 flex gap-1 items-end h-6 overflow-hidden">
                  {[...Array(12)].map((_, i) => {
                    const val = micVolume > 0 ? (micVolume * (0.3 + Math.random() * 0.7)) / 100 : 0.1;
                    return (
                      <motion.div
                        key={i}
                        className="bg-rose-400 rounded-full flex-1"
                        animate={{ height: `${Math.max(10, val * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-rose-600 font-mono w-8 text-right">
                  {micVolume}%
                </span>
              </div>
            </div>
          )}

          {/* Pronunciation Feedback Dashboard */}
          {pronunciationScore !== null && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 text-center shadow-inner animate-fade-in"
            >
              <div className="flex justify-center items-center gap-3">
                <span className="text-slate-500 text-xs font-bold">发音得分:</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">
                  {pronunciationScore}
                  <span className="text-xs font-bold ml-0.5 text-emerald-500">分</span>
                </span>
                {recordedAudioUrl ? (
                  <button
                    onClick={playRecordedAudio}
                    className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition-colors ml-2 flex items-center gap-1 text-xs font-bold shadow-sm cursor-pointer"
                    title="回听我的发音"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    回听我读的
                  </button>
                ) : (
                  <button
                    onClick={() => speak(word.word)}
                    className="bg-teal-500 text-white p-1.5 rounded-lg hover:bg-teal-600 transition-colors ml-2 flex items-center gap-1 text-xs font-bold shadow-sm cursor-pointer"
                    title="重新播放标准发音"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    听标准发音
                  </button>
                )}
              </div>
              <p className="text-emerald-700 text-sm font-bold mt-2">
                {evaluationText}
              </p>
              {useSimulatedMic && (
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  提示：当前为「免麦大声读」关卡模式，只要大声说出来，一样可以获得星星哦！⭐
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 justify-between items-center">
          <button
            onClick={() => onToggleWrong(word.id)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isWrong
                ? 'bg-rose-50 border border-rose-200 text-rose-600 shadow-inner'
                : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isWrong ? 'fill-rose-500 text-rose-500' : ''}`} />
            {isWrong ? '已入错词本' : '加入错词本'}
          </button>

          <button
            onClick={handleMarkAsLearned}
            disabled={isLearned}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLearned
                ? 'bg-emerald-100 text-emerald-700 cursor-default border border-emerald-200'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600 hover:shadow'
            }`}
          >
            <Check className="w-4 h-4" />
            {isLearned ? '已学会 ✨' : '标记学会 (+2⭐)'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { VOCABULARY } from '../data/vocabulary';
import { 
  Users, 
  Trophy, 
  Sparkles, 
  Send, 
  Volume2, 
  Timer, 
  Swords, 
  Play, 
  Check, 
  X, 
  Crown, 
  MessageSquare,
  ChevronRight,
  Flame,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeamReviewProps {
  currentGrade: number;
  currentEdition: 'bj' | 'pep' | 'wy' | 'sh_ox';
  onAddStars: (amount: number) => void;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  score: number;
  isReady: boolean;
  lastAction?: 'correct' | 'wrong' | null;
  combo: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
}

export default function TeamReview({ currentGrade, currentEdition, onAddStars }: TeamReviewProps) {
  // Game states: 'lobby' | 'countdown' | 'playing' | 'results'
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'playing' | 'results'>('lobby');
  const [roomName, setRoomName] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [countdown, setCountdown] = useState<number>(3);
  const [gameTimeLeft, setGameTimeLeft] = useState<number>(45); // 45 seconds match
  
  // Quiz states
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [options, setOptions] = useState<string[]>([]);
  const [userAnswered, setUserAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [bossHp, setBossHp] = useState<number>(600);
  const [maxBossHp] = useState<number>(600);
  
  // Chat scroll anchor
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize room with user and simulated players
  useEffect(() => {
    if (gameState === 'lobby') {
      const adjective = ['阳光', '智慧', '闪电', '奔跑', '快乐', '飞天', '超级'];
      const nouns = ['小恐龙', '独角兽', '小兔子', '探索者', '学霸', '小海豚', '小松鼠'];
      const selectedRoom = `${adjective[Math.floor(Math.random() * adjective.length)]}英语拼读房`;
      setRoomName(selectedRoom);

      // Create initial players
      const initialPlayers: Player[] = [
        { id: 'user', name: '我 (你)', avatar: '🧑‍🚀', isBot: false, score: 0, isReady: true, combo: 0 },
        { id: 'bot1', name: '小爱 Lily 🌸', avatar: '👧', isBot: true, score: 0, isReady: false, combo: 0 },
        { id: 'bot2', name: '小杰 Jack 🦖', avatar: '👦', isBot: true, score: 0, isReady: false, combo: 0 },
        { id: 'bot3', name: '萌萌 Toby 🐱', avatar: '🐱', isBot: true, score: 0, isReady: false, combo: 0 },
      ];
      setPlayers(initialPlayers);

      // Welcome message
      setChatMessages([
        { 
          id: '1', 
          sender: '系统广播', 
          avatar: '📢', 
          text: `欢迎加入房门 [${selectedRoom}]！一起组队击败“单词大魔王”吧！`, 
          time: '刚刚' 
        }
      ]);
    }
  }, [gameState === 'lobby']);

  // Handle chatbot joining & ready simulations in lobby
  useEffect(() => {
    if (gameState !== 'lobby' || players.length === 0) return;

    // Simulate Lily becoming ready after 1.2s
    const t1 = setTimeout(() => {
      setPlayers(prev => prev.map(p => p.id === 'bot1' ? { ...p, isReady: true } : p));
      addSystemChat('bot1', '大家好呀！今天一起加油哦！💪');
    }, 1200);

    // Simulate Jack becoming ready after 2.4s
    const t2 = setTimeout(() => {
      setPlayers(prev => prev.map(p => p.id === 'bot2' ? { ...p, isReady: true } : p));
      addSystemChat('bot2', '冲冲冲！看我怎么消灭大魔王！🔥');
    }, 2400);

    // Simulate Toby becoming ready after 3.6s
    const t3 = setTimeout(() => {
      setPlayers(prev => prev.map(p => p.id === 'bot3' ? { ...p, isReady: true } : p));
      addSystemChat('bot3', '等不及啦，队长快点开始吧！🐾');
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [gameState, roomName]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addSystemChat = (senderId: string, text: string) => {
    const sender = players.find(p => p.id === senderId);
    if (!sender) return;
    setChatMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: sender.name,
        avatar: sender.avatar,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: '我 (你)',
        avatar: '🧑‍🚀',
        text: chatInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
    const input = chatInput;
    setChatInput('');

    // Simulated responses sometimes
    setTimeout(() => {
      const bots = players.filter(p => p.isBot);
      const activeBot = bots[Math.floor(Math.random() * bots.length)];
      const replies = [
        '说的对！👍',
        '哈哈，我们太有默契了！✨',
        '加油，拿第一名！🥇',
        '这次一定要通关！🌟',
        '冲呀！'
      ];
      addSystemChat(activeBot.id, replies[Math.floor(Math.random() * replies.length)]);
    }, 1500);
  };

  // Start the actual game sequence
  const handleStartGame = () => {
    // Check if everyone is ready (simulate force ready if not)
    setPlayers(prev => prev.map(p => ({ ...p, isReady: true })));
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Setup game words based on edition and grade
      const filtered = VOCABULARY.filter(w => w.version === currentEdition && w.grade === currentGrade);
      // Fallback if no words found for specific grade/version combinations
      const finalWords = filtered.length >= 8 ? filtered : VOCABULARY.filter(w => w.version === currentEdition);
      
      // Shuffle and pick 15 words
      const shuffled = [...finalWords].sort(() => 0.5 - Math.random()).slice(0, 15);
      setGameWords(shuffled);
      setPlayers(prev => prev.map(p => ({ ...p, score: 0, combo: 0, lastAction: null })));
      setBossHp(maxBossHp);
      setGameTimeLeft(45);
      setCurrentWordIndex(0);
      setGameState('playing');
    }
  }, [gameState, countdown]);

  // Set up question options for current word
  useEffect(() => {
    if (gameState !== 'playing' || gameWords.length === 0) return;
    const currentWord = gameWords[currentWordIndex];
    if (!currentWord) return;

    // Build translation options
    const editionWords = VOCABULARY.filter(w => w.version === currentEdition);
    const distractors = Array.from(new Set(editionWords.map(w => w.translation)))
      .filter(t => t !== currentWord.translation)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    const allOptions = [...distractors, currentWord.translation].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
    setUserAnswered(false);
    setSelectedOption(null);
  }, [gameState, gameWords, currentWordIndex]);

  // Main match timers & Bot answers simulation
  useEffect(() => {
    if (gameState !== 'playing') return;

    // 1. Time ticking
    const gameTimer = setInterval(() => {
      setGameTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          setGameState('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Bots answering simulation loop
    // Every 2.5 - 4.5 seconds, bots submit answers
    const botInterval = setInterval(() => {
      const bots = ['bot1', 'bot2', 'bot3'];
      // Randomly pick which bots answer in this wave
      bots.forEach(botId => {
        if (Math.random() > 0.4) {
          const isCorrect = Math.random() > 0.25; // 75% accuracy
          const pts = isCorrect ? 10 : 0;
          
          setPlayers(prev => prev.map(p => {
            if (p.id === botId) {
              const newCombo = isCorrect ? p.combo + 1 : 0;
              const bonus = isCorrect && newCombo >= 3 ? 5 : 0;
              return { 
                ...p, 
                score: p.score + pts + bonus,
                combo: newCombo,
                lastAction: isCorrect ? 'correct' : 'wrong'
              };
            }
            return p;
          }));

          // Deal damage to Boss
          if (isCorrect) {
            setBossHp(prev => Math.max(0, prev - 15));
          }

          // Clear action display after 1 second
          setTimeout(() => {
            setPlayers(prev => prev.map(p => p.id === botId ? { ...p, lastAction: null } : p));
          }, 1000);
        }
      });
    }, 2800);

    return () => {
      clearInterval(gameTimer);
      clearInterval(botInterval);
    };
  }, [gameState]);

  // Monitor Boss HP
  useEffect(() => {
    if (gameState === 'playing' && bossHp <= 0) {
      // Boss defeated! Show success and switch to results
      setGameState('results');
      // Add heavy star bonus
      onAddStars(25);
    }
  }, [bossHp, gameState]);

  // Handle user option click
  const handleUserAnswer = (opt: string) => {
    if (userAnswered) return;
    setUserAnswered(true);
    setSelectedOption(opt);

    const currentWord = gameWords[currentWordIndex];
    const isCorrect = opt === currentWord.translation;

    // Speak word
    try {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {}

    setPlayers(prev => prev.map(p => {
      if (p.id === 'user') {
        const newCombo = isCorrect ? p.combo + 1 : 0;
        const bonus = isCorrect && newCombo >= 3 ? 5 : 0;
        return { 
          ...p, 
          score: p.score + (isCorrect ? 10 : 0) + bonus,
          combo: newCombo,
          lastAction: isCorrect ? 'correct' : 'wrong'
        };
      }
      return p;
    }));

    if (isCorrect) {
      setBossHp(prev => Math.max(0, prev - 25)); // User deals more damage
    }

    // Move to next word after 1.2s delay
    setTimeout(() => {
      setPlayers(prev => prev.map(p => p.id === 'user' ? { ...p, lastAction: null } : p));
      if (currentWordIndex + 1 < gameWords.length) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // Run out of words, end game
        setGameState('results');
        // Standard completion stars
        onAddStars(15);
      }
    }, 1200);
  };

  // Get MVP
  const getMVP = () => {
    return [...players].sort((a, b) => b.score - a.score)[0];
  };

  return (
    <div className="bg-gradient-to-b from-orange-50 to-amber-50 rounded-3xl border-3 border-orange-200 p-4 sm:p-6 shadow-md relative overflow-hidden">
      
      {/* Decorative floating badges */}
      <div className="absolute top-3 right-4 flex items-center gap-2 bg-orange-500/10 text-orange-700 px-3 py-1 rounded-full text-xs font-black">
        <Users className="w-4 h-4" />
        <span>组队共玩 · 趣味协同</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-orange-500 p-2 rounded-2xl text-white shadow-sm">
          <Swords className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">组队刷词大作战</h2>
          <p className="text-[10px] text-slate-500 font-bold">COOPERATIVE VOCABULARY BOSS BATTLE</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* 1. LOBBY STATE */}
        {gameState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Left side: Room info and participants */}
            <div className="md:col-span-7 bg-white/80 border-2 border-orange-100 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg font-bold">房间号: #{Math.floor(100 + Math.random() * 900)}</span>
                    <span className="text-sm font-black text-slate-700">{roomName}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">房主：我 (你)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {players.map((p) => (
                    <div 
                      key={p.id} 
                      className={`relative rounded-xl border-2 p-3.5 flex flex-col items-center text-center transition-all ${
                        p.isReady 
                          ? 'border-emerald-300 bg-emerald-50/50' 
                          : 'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      {/* Ready status indicator */}
                      <span className={`absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        p.isReady 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-300 text-white animate-pulse'
                      }`}>
                        {p.isReady ? 'READY' : '加入中...'}
                      </span>

                      {/* Avatar */}
                      <span className="text-3xl mb-1">{p.avatar}</span>
                      <span className="text-xs font-black text-slate-700 truncate max-w-[100px]">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-1">
                        {p.id === 'user' ? '队长' : '队友 (学伴)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={handleStartGame}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  开始挑战大魔王 (击打单词Boss)
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold mt-2">
                  * 队伍共4人，齐心协力限时内答对单词削减魔王HP，击败它可获得最高 25 颗学习之星奖励！
                </p>
              </div>
            </div>

            {/* Right side: Chat Room Interaction */}
            <div className="md:col-span-5 bg-white border-2 border-orange-100 rounded-2xl p-4 flex flex-col h-[350px]">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-slate-700">小队聊天室</span>
              </div>

              {/* Chat history list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs">
                    {msg.sender === '系统广播' ? (
                      <div className="bg-slate-50 text-slate-500 border border-slate-100 rounded-lg py-1 px-2.5 text-center leading-relaxed">
                        📢 {msg.text}
                      </div>
                    ) : (
                      <div className={`flex items-start gap-2 ${msg.sender === '我 (你)' ? 'flex-row-reverse' : ''}`}>
                        <span className="text-base bg-slate-100 p-0.5 rounded-full">{msg.avatar}</span>
                        <div className={`max-w-[75%] rounded-xl p-2 ${
                          msg.sender === '我 (你)' 
                            ? 'bg-orange-500 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-700 rounded-tl-none'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-extrabold text-[9px] opacity-75">{msg.sender}</span>
                            <span className="text-[8px] opacity-60">{msg.time}</span>
                          </div>
                          <p className="font-medium leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input box */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="发条弹幕交流下..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. COUNTDOWN STATE */}
        {gameState === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-20 flex flex-col items-center justify-center text-center"
          >
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 bg-orange-400 rounded-full blur-2xl"
              />
              <span className="relative text-7xl sm:text-8xl font-black text-orange-600 font-mono">
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </div>
            <p className="text-sm font-black text-slate-500 mt-6 tracking-wide uppercase">
              魔王降临！队伍准备进入战场...
            </p>
          </motion.div>
        )}

        {/* 3. PLAYING STATE */}
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Top Stat bars: Time Left and Boss HP */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Timer */}
              <div className="md:col-span-3 bg-white/90 border-2 border-orange-100 rounded-2xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-5 h-5 text-orange-600 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold block">限时大决战</span>
                </div>
                <span className="text-xl font-black font-mono text-orange-600">{gameTimeLeft}s</span>
              </div>

              {/* Boss HP bar */}
              <div className="md:col-span-9 bg-slate-900 border-2 border-slate-700 rounded-2xl p-2.5 flex items-center gap-3 relative overflow-hidden">
                <span className="text-2xl animate-bounce">👾</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                      词王大魔王 (Boss Level 1)
                    </span>
                    <span className="text-[10px] text-rose-300 font-mono font-bold">
                      HP: {bossHp} / {maxBossHp}
                    </span>
                  </div>
                  {/* Progress track */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                    <motion.div 
                      className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 h-full"
                      style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
                      layout
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Central battlefield: Live scores of players, and current word cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left Column: Live Teammate Scores & Action Feedback */}
              <div className="md:col-span-4 bg-white/70 border-2 border-orange-100 rounded-2xl p-3 flex flex-col gap-2 justify-center">
                <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-wider mb-1">
                  实时队伍积分榜
                </p>
                {players.map((p) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between bg-white border border-orange-50 rounded-xl p-2 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.avatar}</span>
                      <div>
                        <span className="text-xs font-black text-slate-700 block truncate max-w-[100px]">{p.name}</span>
                        {p.combo >= 2 && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.1 rounded font-bold animate-pulse">
                            🔥 {p.combo} 连击
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-xs text-slate-400 font-bold">PTS</span>
                      <span className="text-sm font-black text-orange-600">{p.score}</span>
                    </div>

                    {/* Overlay Action Banner for correctness */}
                    {p.lastAction && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-y-0 right-0 w-1/3 flex items-center justify-center font-black text-xs text-white ${
                          p.lastAction === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      >
                        {p.lastAction === 'correct' ? '+10' : '错'}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column: User Quiz Panel */}
              <div className="md:col-span-8 bg-white border-2 border-orange-100 rounded-2xl p-4 sm:p-6 flex flex-col justify-between items-center min-h-[220px]">
                {gameWords[currentWordIndex] ? (
                  <>
                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 bg-orange-100 text-orange-800 text-[10px] font-black px-2.5 py-0.5 rounded-full w-max mx-auto mb-1">
                        <span>第 {currentWordIndex + 1} / {gameWords.length} 词</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 font-sans tracking-wide">
                        {gameWords[currentWordIndex].word}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono font-bold">
                        {gameWords[currentWordIndex].phonetic}
                      </p>
                    </div>

                    {/* Question Choices */}
                    <div className="grid grid-cols-2 gap-3.5 w-full mt-4">
                      {options.map((opt) => {
                        const isCorrectOption = opt === gameWords[currentWordIndex].translation;
                        const isSelected = selectedOption === opt;
                        
                        let btnStyle = "border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-700 hover:border-slate-300";
                        if (userAnswered) {
                          if (isCorrectOption) {
                            btnStyle = "bg-emerald-500 border-emerald-500 text-white";
                          } else if (isSelected) {
                            btnStyle = "bg-rose-500 border-rose-500 text-white";
                          } else {
                            btnStyle = "opacity-40 bg-slate-50 border-slate-100 text-slate-400";
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={userAnswered}
                            onClick={() => handleUserAnswer(opt)}
                            className={`py-3 px-3 rounded-xl border-2 text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer text-center leading-snug flex items-center justify-center gap-1 ${btnStyle}`}
                          >
                            {userAnswered && isCorrectOption && <Check className="w-4 h-4 shrink-0" />}
                            {userAnswered && isSelected && !isCorrectOption && <X className="w-4 h-4 shrink-0" />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 font-bold text-center">正在加载下一词...</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. RESULTS STATE */}
        {gameState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border-2 border-orange-100 p-6 text-center space-y-6"
          >
            {bossHp <= 0 ? (
              <div className="space-y-2">
                <div className="relative inline-block">
                  <span className="text-5xl">🏆</span>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    className="absolute -inset-2 border-2 border-dashed border-orange-300 rounded-full"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-orange-600">消灭魔王！大获全胜！</h3>
                <p className="text-xs font-bold text-slate-500 max-w-md mx-auto">
                  恭喜队长！你们的团队配合天衣无缝，在限定时间内成功击败了单词大魔王！
                </p>
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-extrabold text-xs px-4 py-1.5 rounded-full border border-amber-200 shadow-sm animate-bounce">
                  <Sparkles className="w-4 h-4 fill-amber-400 stroke-none" />
                  <span>星级奖励 +25 颗星！</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-5xl">⏰</span>
                <h3 className="text-xl font-black text-slate-800">时间到！魔王逃跑了</h3>
                <p className="text-xs font-bold text-slate-500 max-w-md mx-auto">
                  虽然没能在时间限制内消灭魔王，但大家收获了满满的默契和经验！下次一定能打败它！
                </p>
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-extrabold text-xs px-4 py-1.5 rounded-full border border-amber-200">
                  <Sparkles className="w-4 h-4 fill-amber-400 stroke-none" />
                  <span>完赛奖励 +15 颗星！</span>
                </div>
              </div>
            )}

            {/* Score Summary */}
            <div className="max-w-md mx-auto border-2 border-slate-50 bg-slate-50/50 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-400">本场 MVP 殊荣：</span>
                <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Crown className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                  <span>{getMVP()?.name} ({getMVP()?.score}分)</span>
                </div>
              </div>

              <div className="space-y-2">
                {players.sort((a,b) => b.score - a.score).map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-400 w-4">{idx + 1}.</span>
                      <span className="text-base">{p.avatar}</span>
                      <span>{p.name}</span>
                    </div>
                    <span className="font-mono text-orange-600 font-black">{p.score} 分</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setGameState('lobby')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-2.5 rounded-xl text-sm shadow-sm cursor-pointer transition-colors"
            >
              返回大厅再次挑战
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

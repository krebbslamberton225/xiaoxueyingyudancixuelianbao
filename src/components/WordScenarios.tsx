import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { VOCABULARY } from '../data/vocabulary';
import { 
  Sparkles, 
  Volume2, 
  Play, 
  Pause, 
  Mic, 
  CheckCircle2, 
  BookOpen, 
  MessageSquare,
  Smile,
  ChevronRight,
  RotateCcw,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordScenariosProps {
  currentEdition: 'bj' | 'pep' | 'wy' | 'sh_ox';
  onAddStars: (amount: number) => void;
}

interface DialogueLine {
  id: string;
  speaker: string;
  avatar: string;
  text: string;
  translation: string;
  highlightedWords: string[]; // words to highlight
}

interface ScenarioTheme {
  id: string;
  title: string;
  emoji: string;
  description: string;
  dialogues: DialogueLine[];
}

export default function WordScenarios({ currentEdition, onAddStars }: WordScenariosProps) {
  // Scenario presets (designed to use actual vocabulary from our VOCABULARY list)
  const scenarios: ScenarioTheme[] = [
    {
      id: 'school',
      title: '学校生活 (At School)',
      emoji: '🏫',
      description: 'Mike 和 Sarah 在教室里整理课桌和文具。',
      dialogues: [
        {
          id: 's1_1',
          speaker: 'Mike',
          avatar: '👦',
          text: 'Hello, Sarah! Look at my new school bag.',
          translation: '你好，Sarah！看看我的新书包。',
          highlightedWords: ['hello', 'bag']
        },
        {
          id: 's1_2',
          speaker: 'Sarah',
          avatar: '👧',
          text: 'Wow, it is red! What is in your bag?',
          translation: '哇，它是红色的！你书包里有什么？',
          highlightedWords: ['red', 'bag']
        },
        {
          id: 's1_3',
          speaker: 'Mike',
          avatar: '👦',
          text: 'I have a book, a pencil, and a ruler.',
          translation: '我有一本书，一支配笔和一把尺子。',
          highlightedWords: ['book', 'pencil', 'ruler']
        },
        {
          id: 's1_4',
          speaker: 'Sarah',
          avatar: '👧',
          text: 'Great! Our teacher is coming. Open your book, please.',
          translation: '太好了！我们的老师来啦。请打开你的书。',
          highlightedWords: ['teacher', 'book']
        }
      ]
    },
    {
      id: 'zoo',
      title: '动物园之旅 (In the Zoo)',
      emoji: '🐼',
      description: '老师带着同学们观赏可爱的国宝大熊猫。',
      dialogues: [
        {
          id: 's2_1',
          speaker: 'Teacher',
          avatar: '👩‍🏫',
          text: 'Look over there, children! What animal is that?',
          translation: '孩子们，看那边！那是什么动物？',
          highlightedWords: ['teacher']
        },
        {
          id: 's2_2',
          speaker: 'Toby',
          avatar: '🐱',
          text: 'It is a big panda! It has two black eyes.',
          translation: '那是一只大熊猫！它长着两只黑眼睛。',
          highlightedWords: ['panda', 'eye']
        },
        {
          id: 's2_3',
          speaker: 'Lily',
          avatar: '👧',
          text: 'It has a big mouth too, and it is eating green bamboo!',
          translation: '它也有一个大嘴巴，正在啃绿色的竹子！',
          highlightedWords: ['mouth']
        },
        {
          id: 's2_4',
          speaker: 'Teacher',
          avatar: '👩‍🏫',
          text: 'Excellent! Pandas are yellow and white on the tummy. So cute.',
          translation: '太棒了！熊猫的肚子是黄白相间的。太可爱了。',
          highlightedWords: ['yellow']
        }
      ]
    },
    {
      id: 'family',
      title: '温馨早餐 (Family Breakfast)',
      emoji: '🥛',
      description: '爸爸和妈妈在餐桌旁，给孩子准备营养的早餐。',
      dialogues: [
        {
          id: 's3_1',
          speaker: 'Father',
          avatar: '👨',
          text: 'Good morning, sweetie! Please drink your warm milk.',
          translation: '早上好，宝贝！请把你的热牛奶喝掉。',
          highlightedWords: ['father', 'milk']
        },
        {
          id: 's3_2',
          speaker: 'Lily',
          avatar: '👧',
          text: 'Thank you, Father! The milk is delicious.',
          translation: '谢谢爸爸！这牛奶太好喝了。',
          highlightedWords: ['father', 'milk']
        },
        {
          id: 's3_3',
          speaker: 'Mother',
          avatar: '👩',
          text: 'Here is some red watermelon for you. Open your mouth!',
          translation: '这里有红西瓜给你吃。张开你的嘴。',
          highlightedWords: ['mother', 'red', 'mouth']
        }
      ]
    },
    {
      id: 'sports',
      title: '运动时光 (Sports & Fun)',
      emoji: '🏀',
      description: '小伙伴在操场上数数、进行篮球运动。',
      dialogues: [
        {
          id: 's4_1',
          speaker: 'Jack',
          avatar: '👦',
          text: 'Let us play basketball together today!',
          translation: '我们今天一起打篮球吧！',
          highlightedWords: ['basketball']
        },
        {
          id: 's4_2',
          speaker: 'Mike',
          avatar: '👦',
          text: 'Okay! Let us count: one, two, three, four... up to ten!',
          translation: '好啊！我们数数：一、二、三、四……到十！',
          highlightedWords: ['one', 'ten']
        },
        {
          id: 's4_3',
          speaker: 'Jack',
          avatar: '👦',
          text: 'You are number one in basketball! Throw it!',
          translation: '你是打篮球的第一名！投出去吧！',
          highlightedWords: ['one']
        }
      ]
    }
  ];

  // Active theme state
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTheme>(scenarios[0]);
  
  // Role play States
  const [rolePlayMode, setRolePlayMode] = useState<boolean>(false);
  const [chosenRole, setChosenRole] = useState<string>(''); // e.g. 'Mike'
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  
  // Speech Recording simulation
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedLines, setRecordedLines] = useState<Record<string, boolean>>({}); // dialogueLineId -> passed
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);

  // Stop TTS if scenario changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    resetRolePlay();
  }, [selectedScenario]);

  const resetRolePlay = () => {
    setCurrentLineIndex(0);
    setIsAutoPlaying(false);
    setIsRecording(false);
    setSpeechFeedback(null);
  };

  // Play audio of a specific sentence using browser speechSynthesis
  const playSentence = (text: string, voiceName?: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // slightly slower for elementary schoolers
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error', e);
    }
  };

  // Automated scene roll (used in Role Play mode)
  useEffect(() => {
    if (!rolePlayMode || !isAutoPlaying) return;

    const currentLine = selectedScenario.dialogues[currentLineIndex];
    if (!currentLine) return;

    // Check if it is the USER's chosen role
    const isUserTurn = currentLine.speaker === chosenRole;

    if (isUserTurn) {
      // Pause auto-play to wait for user to speak
      setIsAutoPlaying(false);
      return;
    }

    // Otherwise, play partner's voice and advance automatically after 3.5s
    playSentence(currentLine.text);
    
    const timer = setTimeout(() => {
      if (currentLineIndex + 1 < selectedScenario.dialogues.length) {
        setCurrentLineIndex(prev => prev + 1);
        setIsAutoPlaying(true);
      } else {
        // End of dialogues
        setIsAutoPlaying(false);
        setSpeechFeedback('恭喜通关情境角色扮演！🎉');
        onAddStars(10);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [rolePlayMode, isAutoPlaying, currentLineIndex, chosenRole, selectedScenario]);

  // Handle simulated Recording
  const handleRecordSpeak = (line: DialogueLine) => {
    if (isRecording) return;
    setIsRecording(true);
    setSpeechFeedback(null);

    // Play word audio so kids can mimic first
    playSentence(line.text);

    // Simulate 2.5 seconds recording waveform
    setTimeout(() => {
      setIsRecording(false);
      setRecordedLines(prev => ({ ...prev, [line.id]: true }));
      setSpeechFeedback('太棒了！发音评分：🌟🌟🌟 (Excellent!)');
      onAddStars(5);

      // Advance to next line automatically after feedback if in Role Play mode
      if (rolePlayMode) {
        setTimeout(() => {
          setSpeechFeedback(null);
          if (currentLineIndex + 1 < selectedScenario.dialogues.length) {
            setCurrentLineIndex(prev => prev + 1);
            setIsAutoPlaying(true); // resume play
          } else {
            setSpeechFeedback('完美完成整场角色扮演！获得学习之星奖励！✨');
            onAddStars(15);
          }
        }, 1500);
      }
    }, 2500);
  };

  // Helper to highlight targeted english keywords
  const renderHighlightedText = (text: string, words: string[]) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
      const cleanPart = part.toLowerCase().replace(/[^a-z]/g, '');
      const isKeyword = words.some(w => cleanPart === w.toLowerCase());
      
      if (isKeyword) {
        return (
          <span 
            key={i} 
            className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg font-black border border-emerald-200 inline-block text-sm sm:text-base cursor-pointer hover:bg-emerald-100 transition-colors"
            onClick={() => playSentence(cleanPart)}
            title="点击朗读单词"
          >
            {part}
          </span>
        );
      }
      return <span key={i} className="text-sm sm:text-base text-slate-700 font-bold">{part}</span>;
    });
  };

  // Get list of unique characters in active scenario
  const getCharacters = () => {
    return Array.from(new Set(selectedScenario.dialogues.map(d => d.speaker)));
  };

  return (
    <div className="bg-gradient-to-b from-emerald-50 to-teal-50 rounded-3xl border-3 border-emerald-200 p-4 sm:p-6 shadow-md">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-2xl text-white shadow-sm">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">单词情境朗读与角色扮演</h2>
            <p className="text-[10px] text-slate-500 font-bold">INTERACTIVE SITUATIONAL ROLE PLAY</p>
          </div>
        </div>

        {/* List of Scenarios dropdown / quick picks */}
        <div className="flex items-center gap-2 flex-wrap">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc);
                setRolePlayMode(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                selectedScenario.id === sc.id
                  ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{sc.emoji} {sc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intro details */}
      <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3 mb-5 flex items-center gap-3">
        <span className="text-3xl">{selectedScenario.emoji}</span>
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase">情境解析 (Scene Summary)</p>
          <p className="text-xs sm:text-sm font-bold text-slate-700">{selectedScenario.description}</p>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Side: Mode Selection & Role Play setup */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-emerald-500" />
              互动学习模式
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setRolePlayMode(false);
                  resetRolePlay();
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 ${
                  !rolePlayMode
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                情境逐句精读 (Study Mode)
              </button>

              <button
                onClick={() => {
                  setRolePlayMode(true);
                  setChosenRole(getCharacters()[0]);
                  resetRolePlay();
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 border-2 ${
                  rolePlayMode
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Mic className="w-4 h-4" />
                角色配音扮演 (Role Play Mode)
              </button>
            </div>

            {/* If in Role Play mode: show character choices and control buttons */}
            {rolePlayMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-3 border-t border-slate-100 space-y-3"
              >
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">1. 选择你想配音的角色：</span>
                  <div className="flex gap-2">
                    {getCharacters().map(char => {
                      const sampleLine = selectedScenario.dialogues.find(d => d.speaker === char);
                      return (
                        <button
                          key={char}
                          onClick={() => {
                            setChosenRole(char);
                            resetRolePlay();
                          }}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            chosenRole === char
                              ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                              : 'border-slate-100 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <span className="text-sm">{sampleLine?.avatar || '👦'}</span>
                          <span>{char}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">2. 控制台：</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        isAutoPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>暂停</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>开始播放</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={resetRolePlay}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
                      title="重新开始"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-emerald-100/40 rounded-2xl p-4 border border-emerald-200">
            <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
              💡 学习小贴士
            </span>
            <p className="text-[11px] text-emerald-700 font-medium leading-relaxed mt-1">
              1. 绿框加粗的单词是本册教材的重要大纲词汇，点击它们可以单独发音。<br/>
              2. 开启<b>角色配音扮演</b>，模仿地道的英语发音和情绪，你将和虚拟学伴一起完成一出短剧！
            </p>
          </div>
        </div>

        {/* Right Side: Dialogue chat interaction area */}
        <div className="md:col-span-8 bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between min-h-[380px]">
          <div className="space-y-4">
            {selectedScenario.dialogues.map((line, idx) => {
              const isSelectedInRolePlay = rolePlayMode && idx === currentLineIndex;
              const isUserSpeaker = line.speaker === chosenRole;
              
              // Styling logic
              let cardBorder = "border-slate-100 bg-slate-50/50";
              if (rolePlayMode) {
                if (isSelectedInRolePlay) {
                  cardBorder = "border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-300";
                } else {
                  cardBorder = "border-slate-50 bg-slate-50/20 opacity-40";
                }
              }

              return (
                <motion.div
                  key={line.id}
                  className={`border-2 rounded-2xl p-3 flex flex-col sm:flex-row items-start justify-between gap-3 transition-all ${cardBorder}`}
                  layout
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl bg-emerald-50 p-1.5 rounded-2xl border border-emerald-100 shrink-0">
                      {line.avatar}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{line.speaker}</span>
                        {rolePlayMode && isUserSpeaker && (
                          <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1 rounded">
                            你扮演
                          </span>
                        )}
                      </div>
                      <p className="flex flex-wrap items-center gap-x-1.5 leading-relaxed">
                        {renderHighlightedText(line.text, line.highlightedWords)}
                      </p>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        {line.translation}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0 flex items-center gap-1.5">
                    {/* Read line button */}
                    <button
                      onClick={() => playSentence(line.text)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 p-2 rounded-xl transition-all cursor-pointer shadow-sm"
                      title="听朗读"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Microphone interactive reading button */}
                    {(!rolePlayMode || isSelectedInRolePlay) && (
                      <button
                        onClick={() => handleRecordSpeak(line)}
                        disabled={isRecording}
                        className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center gap-1 text-xs font-black ${
                          isRecording 
                            ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                            : recordedLines[line.id]
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="练习朗读"
                      >
                        {isRecording ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            <span>录音中...</span>
                          </>
                        ) : recordedLines[line.id] ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>配音完成</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>我读一句</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feedback section */}
          {speechFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-3 text-center mt-4 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400 stroke-none" />
              <span className="text-xs font-black text-amber-800">{speechFeedback}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

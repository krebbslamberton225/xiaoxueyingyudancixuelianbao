import React, { useState, useMemo } from 'react';
import { StudyStats } from '../types';
import { Sparkles, Calendar, Settings2, CheckCircle2, Flame, Star, Award, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyCheckInProps {
  stats: StudyStats;
  onSetGoal: (goal: number) => void;
  onPunchIn: () => void;
}

export default function DailyCheckIn({
  stats,
  onSetGoal,
  onPunchIn,
}: DailyCheckInProps) {
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const goal = stats.dailyWordGoal || 5;
  const todayLearned = stats.todayWordsLearned || [];
  const todayProgress = todayLearned.length;
  const isGoalReached = todayProgress >= goal;

  const todayStr = new Date().toISOString().split('T')[0];
  const isTodayCheckedIn = stats.checkedInDates?.includes(todayStr) || false;

  // Preset options for kids' vocabulary goals
  const goalPresets = [
    { value: 3, label: '🌱 轻松挑战', desc: '每天 3 词，轻轻松松' },
    { value: 5, label: '⭐ 推荐标配', desc: '每天 5 词，扎实稳步' },
    { value: 10, label: '🚀 高效突破', desc: '每天 10 词，飞速进步' },
    { value: 15, label: '👑 小学霸级', desc: '每天 15 词，超越自我' },
  ];

  // Synthesize check-in fanfare chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      };

      // Sound sequence: E5 -> G5 -> C6 -> E6 (Happy fanfare arpeggio)
      playTone(659.25, now, 0.15); // E5
      playTone(783.99, now + 0.12, 0.15); // G5
      playTone(1046.50, now + 0.24, 0.2); // C6
      playTone(1318.51, now + 0.36, 0.45); // E6
    } catch (e) {
      console.log('Fanfare audio failed or blocked by gesture');
    }
  };

  const handlePunchInClick = () => {
    if (!isGoalReached || isTodayCheckedIn) return;
    playChime();
    setShowCelebrate(true);
    onPunchIn();
    
    // Hide celebration banner after 4 seconds
    setTimeout(() => {
      setShowCelebrate(false);
    }, 4500);
  };

  // Calculate the last 7 calendar days
  const weeklyTrack = useMemo(() => {
    const days = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = weekdays[d.getDay()];
      const isCheckedIn = stats.checkedInDates?.includes(dateStr) || false;
      const isDayToday = i === 0;

      days.push({
        dateStr,
        dayOfWeek,
        isCheckedIn,
        isToday: isDayToday,
        dayOfMonth: d.getDate(),
      });
    }
    return days;
  }, [stats.checkedInDates]);

  // Compute progress percentage capped at 100%
  const progressPercent = Math.min(100, Math.round((todayProgress / goal) * 100));

  return (
    <div className="bg-white rounded-3xl border-3 border-amber-100 shadow-xl p-5 mb-6 relative overflow-hidden">
      {/* Background cute blobs */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-50 rounded-full -z-10 opacity-60" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-50 rounded-full -z-10 opacity-50" />

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4.5 border-b border-amber-50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-100/80 p-2 rounded-2xl border border-amber-200">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-1.5">
              每日单词打卡
              <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                <Flame className="w-3 h-3 fill-white stroke-none animate-pulse" />
                连击 {stats.dailyStreak} 天
              </span>
            </h3>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              每天完成学习目标，即可获取星星勋章！
            </p>
          </div>
        </div>

        {/* Setting Button */}
        <button
          onClick={() => setShowGoalSettings(!showGoalSettings)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            showGoalSettings
              ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {showGoalSettings ? '完成设置' : '设置目标'}
        </button>
      </div>

      {/* Expandable Goal Settings */}
      <AnimatePresence>
        {showGoalSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
              <span className="text-xs font-black text-amber-800 block mb-2">💡 选择你的每日单词目标：</span>
              <div className="grid grid-cols-2 gap-2.5">
                {goalPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onSetGoal(preset.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      goal === preset.value
                        ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/20'
                        : 'bg-white/60 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-800 flex items-center justify-between w-full">
                      {preset.label}
                      {goal === preset.value && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium">{preset.desc} (目标: {preset.value}个)</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 justify-between bg-white/80 p-2.5 rounded-xl border border-amber-100/50">
                <span className="text-xs font-extrabold text-slate-600">自定义目标：</span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onSetGoal(Math.max(1, goal - 1))}
                    disabled={goal <= 1}
                    className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-slate-800 text-base w-6 text-center">{goal}</span>
                  <button
                    onClick={() => onSetGoal(Math.min(50, goal + 1))}
                    disabled={goal >= 50}
                    className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer text-sm"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-slate-400">个单词</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main progress action grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center mb-5">
        {/* Progress track */}
        <div className="md:col-span-8 space-y-2.5">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-extrabold text-slate-500">今日打卡进度</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black font-mono text-amber-600">{todayProgress}</span>
                <span className="text-xs font-extrabold text-slate-400">/ {goal} 个已学单词</span>
              </div>
            </div>

            {isGoalReached && !isTodayCheckedIn && (
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1 animate-bounce">
                ✨ 目标达成！可以打卡啦！
              </span>
            )}

            {isTodayCheckedIn && (
              <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
                ⭐ 今日已成功打卡！
              </span>
            )}
          </div>

          {/* Progress bar container */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative">
            <motion.div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalReached
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>

          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>开始今天</span>
            <span>达成：{progressPercent}%</span>
            <span>目标：{goal}个</span>
          </div>
        </div>

        {/* Punch In button or Completed state */}
        <div className="md:col-span-4 flex justify-center">
          {isTodayCheckedIn ? (
            <div className="w-full bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-100 animate-pulse mb-1.5" />
              <span className="text-xs font-black text-emerald-800">今日打卡已完成</span>
              <span className="text-[10px] text-emerald-600 font-bold mt-0.5">连续天数增加！(+10⭐ 奖励)</span>
            </div>
          ) : (
            <button
              onClick={handlePunchInClick}
              disabled={!isGoalReached}
              className={`w-full py-4.5 px-6 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 transition-all shadow-md relative group ${
                isGoalReached
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white cursor-pointer hover:shadow-lg active:scale-98 hover:-translate-y-0.5 border border-amber-400'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className={`w-4 h-4 ${isGoalReached ? 'animate-spin' : ''}`} />
                <span className="text-base tracking-wider">一键打卡 Punch-In</span>
              </div>
              <span className="text-[10px] opacity-90 font-bold">
                {isGoalReached ? '立即打卡，收获 10 颗金星！⭐' : `还差 ${goal - todayProgress} 个单词解锁打卡`}
              </span>

              {isGoalReached && (
                <span className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 7-Day History calendar strip */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
        <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1 mb-2.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          最近 7 天打卡记录
        </span>

        <div className="grid grid-cols-7 gap-1.5">
          {weeklyTrack.map((day) => (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                day.isToday
                  ? 'bg-amber-100/50 border-amber-300 ring-2 ring-amber-400/10'
                  : day.isCheckedIn
                  ? 'bg-emerald-50/50 border-emerald-100'
                  : 'bg-white border-slate-100'
              }`}
            >
              {/* Day Name */}
              <span className="text-[10px] font-black text-slate-400">周{day.dayOfWeek}</span>

              {/* Check-in status or Date */}
              <div className="my-1.5">
                {day.isCheckedIn ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-white stroke-none" />
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-black ${
                    day.isToday ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {day.dayOfMonth}
                  </div>
                )}
              </div>

              {/* Status text */}
              <span className={`text-[9px] font-black ${
                day.isCheckedIn
                  ? 'text-emerald-600'
                  : day.isToday
                  ? 'text-amber-700'
                  : 'text-slate-400'
              }`}>
                {day.isCheckedIn ? '已打卡' : day.isToday ? '今天' : '未打卡'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration Overlay Particle effect */}
      <AnimatePresence>
        {showCelebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-amber-500/10 backdrop-blur-xs flex flex-col items-center justify-center z-20 pointer-events-none"
          >
            {/* SVGs shooting stars */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12;
                const distance = 80 + Math.random() * 40;
                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1.2, 0],
                      x: Math.cos((angle * Math.PI) / 180) * distance,
                      y: Math.sin((angle * Math.PI) / 180) * distance,
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  >
                    <Star className="w-5 h-5 fill-amber-400 text-amber-300 stroke-1" />
                  </motion.div>
                );
              })}
            </div>

            {/* Glowing Text banner */}
            <motion.div
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -20 }}
              className="bg-white border-2 border-amber-300 rounded-2xl px-6 py-4 text-center shadow-2xl max-w-xs pointer-events-auto border-3"
            >
              <Award className="w-12 h-12 text-amber-500 mx-auto animate-bounce mb-2" />
              <h4 className="text-lg font-black text-slate-800">打卡大成功！🎉</h4>
              <p className="text-xs font-bold text-amber-700 mt-1 leading-relaxed">
                恭喜完成今日目标，获得星力加持！
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 bg-slate-50 py-1 px-3 rounded-lg">
                连续学习 {stats.dailyStreak} 天，每日金星 +10⭐
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React from 'react';
import { StudyStats, WrongWordRecord } from '../types';
import { VOCABULARY, GRADES } from '../data/vocabulary';
import { Trophy, Flame, Star, Award, BookOpen, CheckCircle, Percent, Sparkles, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import DailyCheckIn from './DailyCheckIn';

interface StatsDashboardProps {
  stats: StudyStats;
  wrongRecords: WrongWordRecord[];
  onResetStats: () => void;
  onSetGoal?: (goal: number) => void;
  onPunchIn?: () => void;
}

export default function StatsDashboard({
  stats,
  wrongRecords,
  onResetStats,
  onSetGoal,
  onPunchIn,
}: StatsDashboardProps) {
  // Calculate percentage mastery per grade
  const gradeCompletion = GRADES.map(g => {
    const totalInGrade = VOCABULARY.filter(w => w.grade === g.id).length;
    const learnedInGrade = VOCABULARY.filter(w => w.grade === g.id && stats.learnedWordIds.includes(w.id)).length;
    const percent = totalInGrade > 0 ? Math.round((learnedInGrade / totalInGrade) * 100) : 0;
    return {
      ...g,
      total: totalInGrade,
      learned: learnedInGrade,
      percent,
    };
  });

  // Achievements/Medals configuration
  const achievements = [
    {
      id: 'starter',
      title: '英语起步星',
      desc: '标记学会第 1 个单词',
      icon: '🌱',
      color: 'from-emerald-400 to-green-500',
      unlocked: stats.learnedWordIds.length >= 1,
    },
    {
      id: 'ten_words',
      title: '单词小达人',
      desc: '累计掌握 10 个词汇',
      icon: '📚',
      color: 'from-blue-400 to-indigo-500',
      unlocked: stats.learnedWordIds.length >= 10,
    },
    {
      id: 'streak_3',
      title: '持之以恒',
      desc: '连续学习达到 3 天',
      icon: '🔥',
      color: 'from-orange-400 to-red-500',
      unlocked: stats.dailyStreak >= 3,
    },
    {
      id: 'star_master',
      title: '繁星满天',
      desc: '收集超过 50 颗学习之星',
      icon: '🌟',
      color: 'from-yellow-400 to-amber-500',
      unlocked: stats.stars >= 50,
    },
    {
      id: 'error_terminator',
      title: '扫雷小能手',
      desc: '错词消消乐成功闯关',
      icon: '🛡️',
      color: 'from-rose-400 to-pink-500',
      unlocked: stats.quizCount > 0 && wrongRecords.length === 0 && stats.learnedWordIds.length > 0,
    },
    {
      id: 'full_marks',
      title: '学霸勋章',
      desc: '闯关答对率达到 90% 以上',
      icon: '👑',
      color: 'from-purple-400 to-violet-500',
      unlocked: stats.quizCount >= 5 && (stats.correctAnswers / stats.quizCount) >= 0.9,
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-2">
      {onSetGoal && onPunchIn && (
        <DailyCheckIn
          stats={stats}
          onSetGoal={onSetGoal}
          onPunchIn={onPunchIn}
        />
      )}

      {/* Overview stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Streak card */}
        <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Flame className="w-8 h-8 fill-white stroke-none animate-pulse" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">学习守护神</p>
            <h3 className="text-3xl font-black font-mono mt-0.5">{stats.dailyStreak} <span className="text-sm font-bold">天</span></h3>
            <p className="text-white/95 text-xs font-medium mt-1">连击不断，英语棒棒！💪</p>
          </div>
        </div>

        {/* Stars card */}
        <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl p-6 text-white shadow-lg flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Star className="w-8 h-8 fill-white stroke-none animate-bounce" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">学习金星值</p>
            <h3 className="text-3xl font-black font-mono mt-0.5">{stats.stars} <span className="text-sm font-bold">颗</span></h3>
            <p className="text-white/95 text-xs font-medium mt-1">金星灿烂，智慧满载！✨</p>
          </div>
        </div>

        {/* Total learned words card */}
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-6 text-white shadow-lg flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">累计掌握词汇</p>
            <h3 className="text-3xl font-black font-mono mt-0.5">{stats.learnedWordIds.length} <span className="text-sm font-bold">/ {VOCABULARY.length}</span></h3>
            <p className="text-white/95 text-xs font-medium mt-1">掌握率 {Math.round((stats.learnedWordIds.length / VOCABULARY.length) * 100)}%，太棒啦！🎓</p>
          </div>
        </div>
      </div>

      {/* Grade Completion Status */}
      <div className="bg-white rounded-3xl border-3 border-emerald-100 shadow-xl p-6 mb-8">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          分年级词汇掌握度
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gradeCompletion.map(gc => (
            <div key={gc.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-slate-700 text-sm">{gc.label}</span>
                  <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {gc.learned} / {gc.total}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mb-3">{gc.desc}</p>
              </div>

              <div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${gc.percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] font-bold text-slate-400">学习进度</span>
                  <span className="text-xs font-black text-slate-600 font-mono">{gc.percent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Wall */}
      <div className="bg-white rounded-3xl border-3 border-emerald-100 shadow-xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            荣誉勋章墙 ({unlockedCount} / {achievements.length})
          </h3>
          {unlockedCount === achievements.length && (
            <span className="bg-amber-100 text-amber-700 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              荣誉大满贯
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`relative rounded-2xl border p-4.5 text-center flex flex-col items-center justify-between transition-all ${
                ach.unlocked
                  ? 'bg-gradient-to-b from-white to-slate-50/50 border-emerald-100 shadow-sm'
                  : 'bg-slate-50/50 border-slate-100 opacity-60'
              }`}
            >
              {/* Medal Ring */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm mb-3 relative ${
                  ach.unlocked
                    ? `bg-gradient-to-br ${ach.color} text-white`
                    : 'bg-slate-200 text-slate-400 filter grayscale'
                }`}
              >
                {ach.icon}
                {ach.unlocked && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full text-[8px] border border-white font-bold">
                    ✓
                  </span>
                )}
              </div>

              <div>
                <h4 className={`text-sm font-black ${ach.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                  {ach.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1 max-w-[120px] mx-auto">
                  {ach.desc}
                </p>
              </div>

              {/* Locked/Unlocked Overlay status */}
              {!ach.unlocked && (
                <div className="mt-2.5 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded">
                  未解锁
                </div>
              )}
              {ach.unlocked && (
                <div className="mt-2.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  已解锁 ✨
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clear/Reset Stats Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => {
            if (confirm('确定要清除所有的学习进度和错词吗？这将会清空你的成就和星星哦。')) {
              onResetStats();
            }
          }}
          className="text-slate-300 hover:text-rose-400 transition-colors text-xs font-medium border border-transparent hover:border-rose-100 rounded-lg px-3 py-1 cursor-pointer"
        >
          重置我的学习数据
        </button>
      </div>
    </div>
  );
}

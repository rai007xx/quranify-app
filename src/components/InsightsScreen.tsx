import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Trophy,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Target,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { listeningInsightsService } from '../services/listeningInsightsService';

export const InsightsScreen: React.FC = () => {
  const {
    todayListeningSeconds,
    todayListeningMinutes,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    streakDays,
    bestStreakDays,
    thisWeekMinutes,
    weeklyDays,
    isPlaying,
    togglePlayPause,
    currentSurah,
    setTodayListeningSeconds,
    setTodayListeningMinutes,
    setStreakDays,
    setBestStreakDays,
    setWeeklyDays,
    setThisWeekMinutes,
    showToast,
  } = useAudio();

  const [isGoalPickerOpen, setIsGoalPickerOpen] = useState(false);
  const goalOptions = [15, 30, 45, 60];

  const totalGoalSeconds = Math.max(dailyGoalMinutes, 1) * 60;
  const progressPercent = Math.min(
    Math.round((todayListeningSeconds / totalGoalSeconds) * 100),
    100
  );

  // SVG Arc calculation for semi-circle gauge (radius 70)
  const radius = 70;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const handleReset = () => {
    listeningInsightsService.resetToZero();
    setTodayListeningSeconds(0);
    setTodayListeningMinutes(0);
    setStreakDays(0);
    setBestStreakDays(0);
    setWeeklyDays(listeningInsightsService.getWeeklyDaysStatus(dailyGoalMinutes));
    setThisWeekMinutes(0);
    showToast('Insights reset to 0 (Fresh user state)');
  };

  return (
    <div className="py-3 px-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Listening Insights & Goals
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Build consistency with daily Quran recitation and reflection
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer border border-white/[0.06]"
          title="Reset stats to 0 for a fresh start"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* Semi-Circular Gauge / Arc Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131D31] via-[#0D1525] to-[#070A12] border border-white/[0.1] p-5 shadow-2xl mb-4 text-center">
        {/* Top Header with Interactive Goal Selector */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            TODAY'S LISTENING
          </span>

          <div className="relative">
            <button
              onClick={() => setIsGoalPickerOpen(!isGoalPickerOpen)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 transition-colors cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Goal: {dailyGoalMinutes} mins</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Goal Dropdown Picker */}
            {isGoalPickerOpen && (
              <div className="absolute right-0 top-8 z-30 w-36 py-1 bg-[#151F33] border border-white/15 rounded-xl shadow-2xl animate-in fade-in">
                {goalOptions.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setDailyGoalMinutes(mins);
                      setIsGoalPickerOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left font-medium flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${
                      dailyGoalMinutes === mins ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    <span>{mins} minutes</span>
                    {dailyGoalMinutes === mins && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SVG Semi-Circular Arc Gauge */}
        <div className="relative w-52 h-32 mx-auto my-1 flex flex-col items-center justify-end">
          <svg className="w-52 h-32 overflow-visible" viewBox="0 0 160 92">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            {/* Background Arc */}
            <path
              d="M 10 82 A 70 70 0 0 1 150 82"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Active Progress Arc */}
            <path
              d="M 10 82 A 70 70 0 0 1 150 82"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Central numeric display */}
          <div className="absolute bottom-1 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {todayListeningMinutes}
              <span className="text-sm font-normal text-slate-400 ml-1">min</span>
              {todayListeningSeconds > 0 && todayListeningSeconds < 60 && (
                <span className="text-xs font-mono text-emerald-400/90 ml-1.5 font-semibold">
                  ({todayListeningSeconds}s)
                </span>
              )}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">
              {progressPercent}% of {dailyGoalMinutes} min goal
            </span>
          </div>
        </div>

        {/* Pill-shaped Continue listening button */}
        <button
          onClick={togglePlayPause}
          className="w-full mt-4 h-11 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.98] text-slate-950 font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Listening</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" />
              <span>Continue listening ({currentSurah.name})</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Metric Summary Cards (Streak, This Week, Best Record) */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {/* Current Streak: Starts at 0 Days (changes to 1 Day after 1 min listening) */}
        <div className="p-3 rounded-2xl bg-[#101726]/80 border border-white/[0.06] text-center">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-1.5">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <p className="text-base font-extrabold text-white font-mono">
            {streakDays === 0 ? '0 Days' : streakDays === 1 ? '1 Day' : `${streakDays} Days`}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Current Streak</p>
        </div>

        {/* This Week Total Active Minutes (Starts at 0 Min) */}
        <div className="p-3 rounded-2xl bg-[#101726]/80 border border-white/[0.06] text-center">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-extrabold text-white font-mono">{thisWeekMinutes} Min</p>
          <p className="text-[10px] text-slate-400 mt-0.5">This Week</p>
        </div>

        {/* Best Record (Starts at 0 Days) */}
        <div className="p-3 rounded-2xl bg-[#101726]/80 border border-white/[0.06] text-center">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-base font-extrabold text-white font-mono">{bestStreakDays} Days</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Best Record</p>
        </div>
      </div>

      {/* Weekly Reflection Tracker (Mon - Sun) */}
      <div className="p-4 rounded-3xl bg-[#101726]/70 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Weekly Reflection Tracker
          </h4>
          <span className="text-[11px] text-emerald-400 font-semibold font-mono">
            {weeklyDays.filter((d) => d.completed).length} / 7 Days Active
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          {weeklyDays.map((item) => (
            <div key={item.day} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                  item.completed
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                    : item.isToday
                    ? 'bg-white/[0.04] text-emerald-400 ring-2 ring-emerald-400/60'
                    : 'bg-white/[0.03] text-slate-600 border border-white/[0.05]'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-3.5 h-3.5 stroke-[1.5]" />
                )}
              </div>
              <span className={`text-[10px] ${item.isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

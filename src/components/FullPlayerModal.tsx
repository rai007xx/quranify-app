import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  ListMusic,
  Gauge,
  Timer,
  Star,
  Loader2,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { ReciterAvatar } from './ReciterAvatar';
import { AudioSeekSlider } from './AudioSeekSlider';

export const FullPlayerModal: React.FC = () => {
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoading,
    duration,
    playbackSpeed,
    repeatMode,
    isMuted,
    toggleMute,
    togglePlayPause,
    seek,
    skipForward,
    skipBackward,
    nextSurah,
    previousSurah,
    setSpeed,
    toggleRepeat,
    setSleepTimer,
    sleepTimerRemaining,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    setIsQueueOpen,
    isReciterFavorite,
    toggleFavoriteReciter,
  } = useAudio();

  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);

  if (!isFullPlayerOpen) return null;

  const isFav = isReciterFavorite(currentReciter.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[92vh] bg-gradient-to-b from-[#101726] via-[#0B0F19] to-[#07090F] border-t border-white/[0.12] rounded-t-[32px] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto scrollbar-none select-none smooth-scroll gpu-accelerated">
        
        {/* Top Header: Dismiss, "Background sound" Pill Button, Offline Cache Button, & Favorite Star */}
        <div>
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsFullPlayerOpen(false)}
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-400">
                Al-Quran Audio
              </span>
              <span className="text-[10px] text-slate-400">
                Pure Quran Recitation
              </span>
            </div>

            {/* Favorite Star Button */}
            <button
              onClick={() => toggleFavoriteReciter(currentReciter.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isFav
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/[0.05] text-slate-400 hover:text-white'
              }`}
              title={isFav ? "In your favourites" : "Add to favourites"}
            >
              <Star className={`w-5 h-5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center Artwork: Large Circular Reciter Photo with Ambient Glow */}
        <div className="flex flex-col items-center justify-center my-auto py-2">
          <div className="relative">
            {/* Soft Ambient Halo */}
            <div
              className={`absolute -inset-4 rounded-full bg-emerald-500/15 blur-2xl transition-all duration-700 ${
                isPlaying ? 'scale-110 opacity-100' : 'scale-95 opacity-30'
              }`}
            />

            {/* Real Reciter Photo Circular Medallion */}
            <div className="relative p-2 rounded-full border-2 border-emerald-400/40 bg-gradient-to-tr from-emerald-600/30 via-slate-800/80 to-teal-500/30 shadow-2xl">
              <ReciterAvatar
                reciter={currentReciter}
                size="2xl"
                className="shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Surah Title & Reciter Info */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-['Amiri'] text-3xl font-bold text-white drop-shadow">
              {currentSurah.arabicName}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            {currentSurah.name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-sm font-semibold text-emerald-400">
              {currentReciter.name}
            </p>
            <span className="text-slate-600">•</span>
            <p className="text-xs text-slate-400">
              {currentSurah.versesCount} Ayahs
            </p>
          </div>
        </div>

        {/* Isolated High-Performance Decoupled Progress Seeker Slider */}
        <AudioSeekSlider />

        {/* Main Controls: Shuffle, Previous, 10s Rewind, Play/Pause, 10s Forward, Next, Repeat */}
        <div className="flex items-center justify-between gap-1 mb-5 px-2">
          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              repeatMode !== 'none'
                ? 'text-emerald-400 bg-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>

          {/* Previous Surah */}
          <button
            onClick={previousSurah}
            className="w-10 h-10 rounded-full text-slate-200 hover:text-white hover:bg-white/[0.05] flex items-center justify-center transition-all cursor-pointer"
            title="Previous Surah"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* 10s Rewind */}
          <button
            onClick={() => skipBackward(10)}
            className="w-10 h-10 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.05] flex items-center justify-center transition-all cursor-pointer"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Big Play / Pause Circle */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-slate-950 flex items-center justify-center transition-all shadow-xl shadow-emerald-500/30 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin text-slate-950" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-slate-950 stroke-none" />
            ) : (
              <Play className="w-7 h-7 fill-slate-950 stroke-none translate-x-[2px]" />
            )}
          </button>

          {/* 10s Forward */}
          <button
            onClick={() => skipForward(10)}
            className="w-10 h-10 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.05] flex items-center justify-center transition-all cursor-pointer"
            title="Skip forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Next Surah */}
          <button
            onClick={nextSurah}
            className="w-10 h-10 rounded-full text-slate-200 hover:text-white hover:bg-white/[0.05] flex items-center justify-center transition-all cursor-pointer"
            title="Next Surah"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Shuffle toggle */}
          <button
            onClick={() => {}}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Utility Row: Mute Toggle, Speed, Sleep Timer, & Surah Queue Sheet */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs px-2">
          {/* Mute / Unmute Recitation Toggle */}
          <button
            onClick={toggleMute}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white'
            }`}
            title={isMuted ? "Unmute recitation" : "Mute recitation"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>{playbackSpeed}x</span>
            </button>

            {isSpeedMenuOpen && (
              <div className="absolute bottom-10 left-0 bg-[#162032] border border-white/[0.1] rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-20">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpeed(s);
                      setIsSpeedMenuOpen(false);
                    }}
                    className={`px-3 py-1 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => setIsTimerMenuOpen(!isTimerMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {sleepTimerRemaining !== null
                  ? `${Math.ceil(sleepTimerRemaining / 60)}m`
                  : 'Timer'}
              </span>
            </button>

            {isTimerMenuOpen && (
              <div className="absolute bottom-10 right-0 bg-[#162032] border border-white/[0.1] rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-20 w-32">
                {[
                  { label: 'Off', val: null },
                  { label: '15 mins', val: 15 },
                  { label: '30 mins', val: 30 },
                  { label: '45 mins', val: 45 },
                  { label: '60 mins', val: 60 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSleepTimer(item.val);
                      setIsTimerMenuOpen(false);
                    }}
                    className="px-3 py-1 text-xs rounded-lg text-left text-slate-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Change Surah Panel (3-line list icon) */}
          <button
            onClick={() => setIsQueueOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Continue playing: Change Surah list"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

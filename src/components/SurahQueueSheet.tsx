import React, { useState } from 'react';
import { X, Search, Shuffle, Repeat, Play, Pause } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SURAHS, Surah } from '../data/quranData';
import { ReciterAvatar } from './ReciterAvatar';
import { SurahListTile } from './SurahListTile';

export const SurahQueueSheet: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    currentSurah,
    currentReciter,
    isPlaying,
    playSurah,
    togglePlayPause,
    repeatMode,
    toggleRepeat,
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isQueueOpen) return null;

  const filteredSurahs = SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.arabicName.includes(searchQuery) ||
      s.englishMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.number.toString() === searchQuery.trim()
  );

  const handleSelectSurah = (surah: Surah) => {
    if (currentSurah.number === surah.number) {
      togglePlayPause();
    } else {
      playSurah(surah);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[88vh] bg-gradient-to-b from-[#121927] via-[#0C121E] to-[#07090F] border-t border-white/[0.12] rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden gpu-accelerated">
        
        {/* Top Grab Bar & Dismiss */}
        <div className="pt-3 px-5 pb-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
          <button
            onClick={() => setIsQueueOpen(false)}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Reciter Header */}
        <div className="px-5 py-3.5 bg-[#0E1626]/80 border-b border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <ReciterAvatar reciter={currentReciter} size="sm" className="ring-2 ring-emerald-400/40" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                CONTINUE PLAYING
              </span>
              <h3 className="text-sm font-bold text-white truncate">
                {currentReciter.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {currentReciter.style} • 114 Surahs available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleRepeat}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                repeatMode !== 'none'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.05] text-slate-400 hover:text-white'
              }`}
              title="Toggle repeat"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#0A0F1D] border-b border-white/[0.06] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 114 Surahs by name or number..."
              className="w-full bg-[#121927] text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* 114 Surahs Queue List with 90Hz/120Hz native inertia */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 scrollbar-thin scrollbar-thumb-white/10 smooth-scroll gpu-accelerated">
          {filteredSurahs.map((surah) => {
            const isCurrent = currentSurah.number === surah.number;
            const isPlayingThis = isCurrent && isPlaying;

            return (
              <SurahListTile
                key={surah.number}
                surah={surah}
                reciter={currentReciter}
                isActive={isCurrent}
                isPlaying={isPlayingThis}
                onSelect={handleSelectSurah}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

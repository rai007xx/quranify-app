import React from 'react';
import { Play, Pause, SkipForward, Loader2, Star } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { ReciterAvatar } from './ReciterAvatar';
import { MiniPlayerProgressBar } from './MiniPlayerProgressBar';

export const MiniPlayer: React.FC = () => {
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoading,
    togglePlayPause,
    nextSurah,
    setIsFullPlayerOpen,
    isReciterFavorite,
    toggleFavoriteReciter,
    isOfflineModeEnabled,
    isCurrentTrackCached,
  } = useAudio();

  const isFav = isReciterFavorite(currentReciter.id);

  return (
    <div className="px-3 pb-1 pt-1">
      {/* High-Performance GPU-Accelerated Container (Zero heavy blur passes for 90Hz/120Hz) */}
      <div
        onClick={() => setIsFullPlayerOpen(true)}
        className="w-full bg-[#0D131F] border border-white/[0.1] rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-[0_12px_36px_rgba(0,0,0,0.85)] hover:border-[#00E676]/40 transition-all cursor-pointer group relative overflow-hidden gpu-accelerated"
      >
        {/* Decoupled GPU-Accelerated Live Audio Progress Bar */}
        <MiniPlayerProgressBar />

        {/* Top subtle sheen line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#00E676]/35 to-transparent pointer-events-none" />

        {/* Left: Small circular avatar of active reciter */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-[1.5px] border-white/[0.15] shadow-md">
              <ReciterAvatar
                reciter={currentReciter}
                size="sm"
                className="w-full h-full border-0"
              />
            </div>

            {/* Subtle Playing Pulse Dot */}
            {isPlaying && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E676] border border-[#0B1017]" />
              </span>
            )}
          </div>

          {/* Center: Clear Surah number + name */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold text-white group-hover:text-[#38EF7D] transition-colors truncate">
                {currentSurah.number}. {currentSurah.name}
              </p>
              {isOfflineModeEnabled && (
                <span className="text-[9px] font-bold px-1.5 py-[0.5px] rounded bg-[#00E676]/20 text-[#00E676] font-mono tracking-wider shrink-0">
                  OFFLINE
                </span>
              )}
              {isCurrentTrackCached && !isOfflineModeEnabled && (
                <span className="text-[9px] font-semibold text-[#00E676] shrink-0" title="Available offline">
                  ●
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium shrink-0 font-['Amiri'] hidden xs:inline">
                ({currentSurah.arabicName})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {currentReciter.name}
            </p>
          </div>
        </div>

        {/* Right: Minimalist star button, circular accent Play/Pause button, and Next track icon */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Minimalist Star Button */}
          <button
            onClick={() => toggleFavoriteReciter(currentReciter.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title={isFav ? 'In favourites' : 'Add to favourites'}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
          </button>

          {/* Circular Accent Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E676] to-[#00B0FF] hover:opacity-95 active:scale-95 text-[#070B11] flex items-center justify-center transition-all shadow-lg shadow-[#00E676]/25 cursor-pointer disabled:opacity-75"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#070B11]" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-[#070B11] stroke-none" />
            ) : (
              <Play className="w-4 h-4 fill-[#070B11] stroke-none translate-x-[1px]" />
            )}
          </button>

          {/* Next Track Icon */}
          <button
            onClick={nextSurah}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Next Surah"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

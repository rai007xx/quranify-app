import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Reciter, Surah, SURAHS, RECITERS } from '../data/quranData';
import { playbackHistoryService } from '../services/playbackHistoryService';
import { ReciterAvatar } from './ReciterAvatar';

interface FeaturedCardProps {
  reciter: Reciter;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({ reciter: defaultReciter }) => {
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    lastPlayback,
    resumeLastPlayback,
    playSurah,
    togglePlayPause,
    isReciterFavorite,
    toggleFavoriteReciter,
  } = useAudio();

  // Dynamically resolve reciter & surah from last saved playback history if available
  const hasHistory = lastPlayback !== null && lastPlayback.positionSeconds > 0;
  const activeReciter: Reciter = hasHistory
    ? RECITERS.find((r) => r.id === lastPlayback.reciterId) || currentReciter
    : currentReciter;

  const activeSurah: Surah = hasHistory
    ? SURAHS.find((s) => s.number === lastPlayback.surahNumber) || currentSurah
    : currentSurah;

  const isCurrentPlaying = isPlaying && currentReciter.id === activeReciter.id;
  const isFav = isReciterFavorite(activeReciter.id);

  const savedSeconds = hasHistory ? lastPlayback.positionSeconds : 0;
  const formattedSavedTime = playbackHistoryService.formatSeconds(savedSeconds);
  const progressPercent =
    hasHistory && lastPlayback.totalDurationSeconds > 0
      ? Math.min(Math.round((savedSeconds / lastPlayback.totalDurationSeconds) * 100), 100)
      : 0;

  const handleContinueListening = () => {
    if (isCurrentPlaying) {
      togglePlayPause();
    } else if (hasHistory) {
      resumeLastPlayback();
    } else {
      playSurah(activeSurah, activeReciter);
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#070B11] via-[#090E17] to-[#0D141F] border border-white/[0.08] p-5 shadow-2xl group gpu-accelerated">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Category Badge & Translucent Heart */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse shadow-[0_0_8px_#00E676]" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#00E676] font-mono">
              {hasHistory ? 'CONTINUE LISTENING' : 'FROM YOUR FAVOURITES'}
            </span>
          </div>

          <button
            onClick={() => toggleFavoriteReciter(activeReciter.id)}
            className="w-8 h-8 rounded-full bg-[#131B29] border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow"
            title={isFav ? 'In favourites' : 'Add to favourites'}
          >
            <Heart
              className={`w-4 h-4 ${
                isFav ? 'fill-rose-500 stroke-rose-400 text-rose-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Hero Row: 70x70 Avatar with Live Pulse Dot & Typography */}
        <div className="flex items-center gap-4 mb-4 relative z-10">
          {/* Left: 70x70 Circular Reciter Photo with subtle green live-pulse dot on top */}
          <div className="relative shrink-0">
            <div className="w-[70px] h-[70px] rounded-full overflow-hidden border-[1.5px] border-white/[0.12] shadow-xl">
              <ReciterAvatar reciter={activeReciter} size="lg" className="border-0" />
            </div>

            {/* Subtle Green Live-Pulse Dot on top right */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00E676] border-2 border-[#070B11]" />
            </span>
          </div>

          {/* Right: Reciter Name in bold white typography (w700, 20sp), underneath Surah name in soft mint green with modern Arabic font */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] font-bold text-white tracking-tight truncate leading-tight font-['Plus_Jakarta_Sans']">
              {activeReciter.name}
            </h2>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#38EF7D] font-['Amiri'] leading-snug truncate">
                {activeSurah.number}. {activeSurah.name} ({activeSurah.arabicName})
              </span>
            </div>

            {/* Subtitle / Progress tag: e.g. "Resumes from 14:32 (45%)" */}
            {hasHistory ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00E676] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                  Resumes from {formattedSavedTime}
                  {progressPercent > 0 && ` (${progressPercent}%)`}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {activeReciter.style} • {activeReciter.country}
              </p>
            )}
          </div>
        </div>

        {/* Small progress bar track if resuming */}
        {hasHistory && progressPercent > 0 && (
          <div className="w-full bg-white/[0.06] rounded-full h-1 mb-3.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00E676] to-[#00B0FF] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Continue listening button: sleek pill button with emerald-to-teal gradient [Color(0xFF00E676), Color(0xFF00B0FF)], bold dark text, and gentle drop shadow */}
        <button
          onClick={handleContinueListening}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[#00E676] to-[#00B0FF] hover:opacity-95 active:scale-[0.98] text-[#070B11] font-bold text-[14px] tracking-wide flex items-center justify-center gap-2.5 shadow-[0_8px_20px_rgba(0,230,118,0.25)] transition-all cursor-pointer relative z-10"
        >
          {isCurrentPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-[#070B11] stroke-none" />
              <span>Pause playback</span>
            </>
          ) : hasHistory ? (
            <>
              <Play className="w-4 h-4 fill-[#070B11] stroke-none translate-x-[1px]" />
              <span>Continue from {formattedSavedTime}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-[#070B11] stroke-none translate-x-[1px]" />
              <span>Continue listening</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Heart, Play, Pause, Search } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SURAHS, Surah } from '../data/quranData';
import { ReciterAvatar } from './ReciterAvatar';
import { SurahListTile } from './SurahListTile';

export const ReciterProfileModal: React.FC = () => {
  const {
    profileReciter,
    setProfileReciter,
    currentSurah,
    currentReciter,
    isPlaying,
    playSurah,
    togglePlayPause,
    isReciterFavorite,
    toggleFavoriteReciter,
  } = useAudio();

  const [searchSurah, setSearchSurah] = useState('');

  if (!profileReciter) return null;

  const isFav = isReciterFavorite(profileReciter.id);

  const filteredSurahs = SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchSurah.toLowerCase()) ||
      s.arabicName.includes(searchSurah) ||
      s.number.toString() === searchSurah.trim()
  );

  const handlePlaySurah = (surah: Surah) => {
    if (currentReciter.id === profileReciter.id && currentSurah.number === surah.number) {
      togglePlayPause();
    } else {
      playSurah(surah, profileReciter);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[92vh] bg-gradient-to-b from-[#101726] via-[#0A0E18] to-[#07090F] border-t border-white/[0.12] rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden gpu-accelerated">
        
        {/* Modal Top Grabber & Close */}
        <div className="pt-3 px-6 pb-2 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
          <button
            onClick={() => setProfileReciter(null)}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reciter Header Profile with Real Photo */}
        <div className="p-5 border-b border-white/[0.06] bg-[#0E1524]/60 shrink-0">
          <div className="flex items-center gap-4">
            {/* Real Photo Avatar */}
            <div className="relative shrink-0">
              <div className="p-0.5 rounded-full border-2 border-emerald-400/50 shadow-xl">
                <ReciterAvatar reciter={profileReciter} size="lg" />
              </div>
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {profileReciter.country}
                </span>
                {profileReciter.isNew && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                    NEW
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight truncate mt-1">
                {profileReciter.name}
              </h3>
              <p className="font-['Amiri'] text-sm text-emerald-300">
                {profileReciter.arabicName}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {profileReciter.style} • 114 Surahs available
              </p>
            </div>
          </div>

          {/* Bio text */}
          {profileReciter.bio && (
            <p className="text-xs text-slate-300/80 mt-3 leading-relaxed">
              {profileReciter.bio}
            </p>
          )}

          {/* Prominent "Add to Favourites" Toggle Button */}
          <div className="mt-4">
            <button
              onClick={() => toggleFavoriteReciter(profileReciter.id)}
              className={`w-full py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isFav
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400 stroke-rose-400' : 'fill-none stroke-current'}`} />
              <span>{isFav ? 'In Your Favourites (Tap to remove)' : 'Add to Your Favourites'}</span>
            </button>
          </div>
        </div>

        {/* Surahs Search */}
        <div className="p-3 border-b border-white/[0.06] bg-[#0A0F1D] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchSurah}
              onChange={(e) => setSearchSurah(e.target.value)}
              placeholder="Search 114 Surahs for this reciter..."
              className="w-full bg-[#121927] text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Scrollable Surah Catalog with 90Hz/120Hz native inertia */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 smooth-scroll gpu-accelerated">
          {filteredSurahs.map((surah) => {
            const isPlayingThis =
              isPlaying &&
              currentReciter.id === profileReciter.id &&
              currentSurah.number === surah.number;

            return (
              <SurahListTile
                key={surah.number}
                surah={surah}
                reciter={profileReciter}
                isActive={currentSurah.number === surah.number && currentReciter.id === profileReciter.id}
                isPlaying={isPlayingThis}
                onSelect={handlePlaySurah}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

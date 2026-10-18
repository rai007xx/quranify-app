import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Heart, Flame } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { RECITERS, Reciter } from '../data/quranData';
import { ReciterAvatar } from './ReciterAvatar';
import { ReciterAvatarCard } from './ReciterAvatarCard';

export const RecitersScreen: React.FC = () => {
  const {
    currentReciter,
    selectReciter,
    isPlaying,
    favoriteReciterIds,
    isReciterFavorite,
    toggleFavoriteReciter,
    setProfileReciter,
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState('');

  // Favorite reciters list
  const favoriteReciters = useMemo(() => {
    return RECITERS.filter((r) => favoriteReciterIds.includes(r.id));
  }, [favoriteReciterIds]);

  // Filtered by search if searching
  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return RECITERS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.arabicName.includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.style.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Categorized Reciter lists
  const newReciters = useMemo(() => RECITERS.filter((r) => r.isNew), []);
  const saudiReciters = useMemo(() => RECITERS.filter((r) => r.countryCategory === 'Saudi Arabia'), []);
  const egyptReciters = useMemo(() => RECITERS.filter((r) => r.countryCategory === 'Egypt'), []);
  const uzbekReciters = useMemo(() => RECITERS.filter((r) => r.countryCategory === 'Uzbekistan'), []);
  const russiaReciters = useMemo(() => RECITERS.filter((r) => r.countryCategory === 'Russia'), []);
  const tajwidReciters = useMemo(() => RECITERS.filter((r) => r.isBestForTajwid), []);
  const otherReciters = useMemo(() => RECITERS.filter((r) => r.countryCategory === 'Other'), []);

  const handleReciterClick = (reciter: Reciter) => {
    selectReciter(reciter);
    setProfileReciter(reciter);
  };

  const renderReciterAvatarItem = (reciter: Reciter, showNewBadge = false) => {
    const isFav = isReciterFavorite(reciter.id);
    const isSelected = currentReciter.id === reciter.id;

    return (
      <ReciterAvatarCard
        key={reciter.id}
        id={reciter.id}
        name={reciter.name}
        photoUrl={reciter.photoUrl}
        isSelected={isSelected}
        isFavorite={isFav}
        size="md"
        badge={showNewBadge || reciter.isNew ? 'NEW' : undefined}
        badgeColor="bg-emerald-500 text-slate-950 font-bold"
        isPlaying={isSelected && isPlaying}
        onTap={() => handleReciterClick(reciter)}
        onToggleFavorite={() => toggleFavoriteReciter(reciter.id)}
      />
    );
  };

  const renderHorizontalSection = (
    title: string,
    reciters: Reciter[],
    badge?: string,
    badgeColor?: string
  ) => {
    if (reciters.length === 0) return null;

    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
            {badge && (
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                  badgeColor || 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {reciters.length} Qaris
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none smooth-scroll gpu-accelerated">
          {reciters.map((r) => renderReciterAvatarItem(r, title === 'New reciters'))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-3 px-4">
      {/* 1. Rounded Search Bar */}
      <div className="relative mb-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reciters by name, country, or style..."
            className="w-full h-11 bg-[#101625] text-white placeholder-slate-500 text-xs rounded-full pl-11 pr-10 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* If Searching, show search results */}
      {filteredSearch !== null ? (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Search Results ({filteredSearch.length})
          </p>
          {filteredSearch.map((r) => (
            <div
              key={r.id}
              onClick={() => handleReciterClick(r)}
              className="p-3 rounded-2xl bg-[#101726]/80 border border-white/[0.06] flex items-center justify-between cursor-pointer hover:bg-[#151F33] transition-colors"
            >
              <div className="flex items-center gap-3">
                <ReciterAvatar reciter={r} size="sm" className="ring-1 ring-white/10" />
                <div>
                  <p className="text-sm font-bold text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.country} • {r.style}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
          {filteredSearch.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-500">No reciters found.</p>
          )}
        </div>
      ) : (
        <>
          {/* 2. "Top Reciters this month" Hero Card with 3 Overlapping Real Photos */}
          <div
            onClick={() => handleReciterClick(RECITERS[0])}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A2338] via-[#101726] to-[#0A0E17] border border-white/[0.1] p-4.5 shadow-2xl mb-5 group cursor-pointer hover:border-emerald-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Flame className="w-2.5 h-2.5 fill-amber-400" />
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 font-mono">
                    TOP RECITERS THIS MONTH
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">
                  Yasser Al-Dosari & Top Imams
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Over 2.4M listens this month • Tap to explore
                </p>

                {/* 3 Overlapping Circular Real Photos with Depth */}
                <div className="flex items-center mt-3">
                  <div className="flex items-center -space-x-2.5">
                    <div className="relative z-30 ring-2 ring-[#101726] rounded-full">
                      <ReciterAvatar reciter={RECITERS[0]} size="xs" />
                    </div>
                    <div className="relative z-20 ring-2 ring-[#101726] rounded-full">
                      <ReciterAvatar reciter={RECITERS[1]} size="xs" />
                    </div>
                    <div className="relative z-10 ring-2 ring-[#101726] rounded-full">
                      <ReciterAvatar reciter={RECITERS[2]} size="xs" />
                    </div>
                  </div>
                  <span className="ml-3 text-[11px] font-medium text-slate-300">
                    +{RECITERS.length - 3} other Qaris
                  </span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-white/[0.08] group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-all shrink-0 ml-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. "Your favourites" horizontal row with persistent dynamic state */}
          <div className="mb-5 p-3 rounded-3xl bg-[#0D1424]/60 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <h4 className="text-sm font-bold text-white tracking-tight">Your favourites</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {favoriteReciters.length} Saved
              </span>
            </div>

            {favoriteReciters.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {favoriteReciters.map((r) => renderReciterAvatarItem(r))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">No favourites added yet.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap the heart icon on any reciter below to pin them here!
                </p>
              </div>
            )}
          </div>

          {/* 4. Categorized Horizontal Sections matching exact prompt */}
          {renderHorizontalSection('New reciters', newReciters, 'NEW', 'bg-emerald-500/20 text-emerald-300')}
          {renderHorizontalSection('From Saudi Arabia', saudiReciters, 'Imams of Haramain')}
          {renderHorizontalSection('From Egypt', egyptReciters, 'Classical Masters')}
          {renderHorizontalSection('From Uzbekistan', uzbekReciters, 'Central Asia')}
          {renderHorizontalSection('From Russia', russiaReciters, 'Eurasia & Dagestan')}
          {renderHorizontalSection('Best for Tajwid', tajwidReciters, 'Reference Audio')}
          {renderHorizontalSection('Other reciters', otherReciters)}
        </>
      )}
    </div>
  );
};

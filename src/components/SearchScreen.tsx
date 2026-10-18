import React, { useState, useMemo } from 'react';
import { Search, X, Mic2, BookOpen, ListMusic, Play, Pause, ChevronRight, Sparkles, Star, Waves, Moon, Heart, Volume2 } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { RECITERS, SURAHS, Reciter, Surah } from '../data/quranData';
import { ReciterAvatar } from './ReciterAvatar';

type FilterChip = 'all' | 'reciters' | 'surahs' | 'playlists';

interface PlaylistEntry {
  id: string;
  title: string;
  subtitle: string;
  surahNumber: number;
  gradient: string;
  icon: any;
}

const CURATED_PLAYLISTS: PlaylistEntry[] = [
  {
    id: 'favourites',
    title: 'Favourites',
    subtitle: 'Curated daily Quran gems',
    surahNumber: 1,
    gradient: 'from-amber-500/30 to-[#0A0E17]',
    icon: Star,
  },
  {
    id: 'focus_work',
    title: 'Focus & Work',
    subtitle: 'Calm recitations for deep concentration',
    surahNumber: 55,
    gradient: 'from-cyan-600/30 to-[#0A0E17]',
    icon: Waves,
  },
  {
    id: 'sleep_mode',
    title: 'Sleep Mode',
    subtitle: 'Gentle night soothing recitations',
    surahNumber: 67,
    gradient: 'from-indigo-600/30 to-[#0A0E17]',
    icon: Moon,
  },
  {
    id: 'most_beautiful',
    title: 'Most Beautiful Recitations',
    subtitle: 'Masterpiece Maqamat & timeless voices',
    surahNumber: 19,
    gradient: 'from-pink-600/30 to-[#0A0E17]',
    icon: Heart,
  },
  {
    id: 'duaa_ruqia',
    title: 'Duaa & Ruqia',
    subtitle: 'Spiritual healing & steadfast protection',
    surahNumber: 112,
    gradient: 'from-emerald-600/30 to-[#0A0E17]',
    icon: Sparkles,
  },
  {
    id: 'emotional',
    title: 'Emotional Recitations',
    subtitle: 'Deeply moving verses that shake the soul',
    surahNumber: 36,
    gradient: 'from-purple-600/30 to-[#0A0E17]',
    icon: Heart,
  },
];

const TRENDING_KEYWORDS = [
  'Al-Kahf',
  'Yasser Al-Dosari',
  'Ar-Rahman',
  'Sleep Mode',
  'Mishary Alafasy',
  'Al-Mulk',
  'Sudais',
  'Focus & Work',
];

export const SearchScreen: React.FC = () => {
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    playSurah,
    togglePlayPause,
    selectReciter,
    setProfileReciter,
  } = useAudio();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');

  // Filter reciters
  const matchedReciters = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return RECITERS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.arabicName.includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.style.toLowerCase().includes(q)
    );
  }, [query]);

  // Filter surahs
  const matchedSurahs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.arabicName.includes(q) ||
        s.englishMeaning.toLowerCase().includes(q) ||
        s.number.toString() === q ||
        `${s.versesCount} ayats`.includes(q) ||
        `${s.versesCount} verses`.includes(q)
    );
  }, [query]);

  // Filter playlists
  const matchedPlaylists = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return CURATED_PLAYLISTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [query]);

  const handleReciterClick = (reciter: Reciter) => {
    selectReciter(reciter);
    setProfileReciter(reciter);
  };

  const handleSurahClick = (surah: Surah) => {
    if (currentSurah.number === surah.number) {
      togglePlayPause();
    } else {
      playSurah(surah);
    }
  };

  const handlePlaylistClick = (playlist: PlaylistEntry) => {
    const targetSurah = SURAHS.find((s) => s.number === playlist.surahNumber) || SURAHS[0];
    playSurah(targetSurah);
  };

  const hasResults =
    (activeFilter === 'all' && (matchedReciters.length > 0 || matchedSurahs.length > 0 || matchedPlaylists.length > 0)) ||
    (activeFilter === 'reciters' && matchedReciters.length > 0) ||
    (activeFilter === 'surahs' && matchedSurahs.length > 0) ||
    (activeFilter === 'playlists' && matchedPlaylists.length > 0);

  return (
    <div className="flex flex-col min-h-full pb-10 gpu-accelerated">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-30 bg-[#05090F] pt-3 pb-2 px-4 border-b border-white/[0.06]">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Reciters, surahs, collections..."
            className="w-full bg-[#0E1526] text-white placeholder-slate-400 text-sm rounded-xl pl-10 pr-9 py-2.5 border border-white/[0.08] focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
            autoFocus={false}
          />
          {query.trim().length > 0 && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('reciters')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeFilter === 'reciters'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]'
            }`}
          >
            <Mic2 className="w-3 h-3" />
            Reciters {query && `(${matchedReciters.length})`}
          </button>
          <button
            onClick={() => setActiveFilter('surahs')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeFilter === 'surahs'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Surahs {query && `(${matchedSurahs.length})`}
          </button>
          <button
            onClick={() => setActiveFilter('playlists')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeFilter === 'playlists'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]'
            }`}
          >
            <ListMusic className="w-3 h-3" />
            Playlists {query && `(${matchedPlaylists.length})`}
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-4 py-4 space-y-6">
        {/* If no query: show Trending Searches & Categories */}
        {!query.trim() && (
          <>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Trending Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setQuery(kw)}
                    className="px-3 py-1.5 rounded-xl bg-[#0E1526] hover:bg-[#162035] text-xs font-medium text-slate-200 border border-white/[0.06] hover:border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Search className="w-3 h-3 text-emerald-400" />
                    <span>{kw}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Browse collections */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Curated Collections
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {CURATED_PLAYLISTS.slice(0, 4).map((pl) => {
                  const Icon = pl.icon;
                  return (
                    <div
                      key={pl.id}
                      onClick={() => handlePlaylistClick(pl)}
                      className="p-3 rounded-2xl bg-[#0E1526] border border-white/[0.06] hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-white tracking-tight">{pl.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{pl.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Reciters Quick Strip */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Popular Reciters
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {RECITERS.slice(0, 6).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleReciterClick(r)}
                    className="p-2.5 rounded-2xl bg-[#0E1526] border border-white/[0.06] hover:border-emerald-500/40 flex flex-col items-center text-center group cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden mb-2 ring-2 ring-white/10 group-hover:ring-emerald-400 transition-all">
                      <ReciterAvatar
                        reciter={r}
                        size="xs"
                      />
                    </div>
                    <span className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {r.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{r.country}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Searching Results */}
        {query.trim() && !hasResults && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0E1526] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No results found for "{query}"</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Try searching by Surah name, reciter name (e.g., Yasser, Sudais), Surah number, or collections.
            </p>
          </div>
        )}

        {/* Reciters Section */}
        {query.trim() && (activeFilter === 'all' || activeFilter === 'reciters') && matchedReciters.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reciters ({matchedReciters.length})</span>
              </h3>
            </div>
            <div className="space-y-1.5">
              {matchedReciters.map((reciter) => {
                const isSelected = currentReciter.id === reciter.id;
                return (
                  <div
                    key={reciter.id}
                    onClick={() => handleReciterClick(reciter)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-[#0E1526] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ReciterAvatar
                          reciter={reciter}
                          size="sm"
                        />
                        {isSelected && isPlaying && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Volume2 className="w-2.5 h-2.5 text-slate-950 animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {reciter.name}
                          </h4>
                          {reciter.isNew && (
                            <span className="text-[9px] font-extrabold uppercase bg-emerald-500 text-slate-950 px-1 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {reciter.arabicName} • {reciter.country} • {reciter.style}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-white">
                      <span className="text-[10px] font-semibold">114 Surahs</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Surahs Section */}
        {query.trim() && (activeFilter === 'all' || activeFilter === 'surahs') && matchedSurahs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Surahs ({matchedSurahs.length})</span>
              </h3>
            </div>
            <div className="space-y-1.5">
              {matchedSurahs.map((surah) => {
                const isCurrent = currentSurah.number === surah.number;
                return (
                  <div
                    key={surah.number}
                    onClick={() => handleSurahClick(surah)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                      isCurrent
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-[#0E1526] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-white/[0.06] text-slate-300 group-hover:bg-white/[0.1]'
                        }`}
                      >
                        {surah.number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-bold transition-colors ${
                              isCurrent ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'
                            }`}
                          >
                            {surah.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            ({surah.englishMeaning})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {surah.revelationType} • {surah.versesCount} verses
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-arabic text-sm text-slate-200">
                        {surah.arabicName}
                      </span>
                      <button
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCurrent && isPlaying
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-white/[0.08] text-white hover:bg-emerald-500 hover:text-slate-950'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Playlists Section */}
        {query.trim() && (activeFilter === 'all' || activeFilter === 'playlists') && matchedPlaylists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Collections ({matchedPlaylists.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {matchedPlaylists.map((pl) => {
                const Icon = pl.icon;
                return (
                  <div
                    key={pl.id}
                    onClick={() => handlePlaylistClick(pl)}
                    className="p-3 rounded-2xl bg-[#0E1526] border border-white/[0.06] hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{pl.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{pl.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

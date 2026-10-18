import React, { useState, useMemo, useEffect } from 'react';
import { Search, Compass, ArrowDownCircle } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Surah, SURAHS } from '../data/quranData';
import { SurahListTile } from './SurahListTile';
import { downloadService } from '../services/downloadService';

export const SurahList: React.FC = () => {
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    playSurah,
    togglePlayPause,
  } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan' | 'downloaded'>('all');
  const [downloadVersion, setDownloadVersion] = useState(0);

  // Subscribe to download updates so the filter tab badge stays reactive
  useEffect(() => {
    const unsub = downloadService.subscribe(() => {
      setDownloadVersion((v) => v + 1);
    });
    return unsub;
  }, []);

  const downloadedCount = useMemo(() => {
    return SURAHS.filter((s) => downloadService.isDownloaded(currentReciter.id, s.number)).length;
  }, [currentReciter.id, downloadVersion]);

  const filteredSurahs = useMemo(() => {
    return SURAHS.filter((surah) => {
      const matchesSearch =
        surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.arabicName.includes(searchQuery) ||
        surah.englishMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.number.toString() === searchQuery.trim();

      const isDownloaded = downloadService.isDownloaded(currentReciter.id, surah.number);
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'downloaded'
          ? isDownloaded
          : surah.revelationType === filterType);

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterType, currentReciter.id, downloadVersion]);

  const handleSurahClick = (surah: Surah) => {
    if (currentSurah.number === surah.number) {
      togglePlayPause();
    } else {
      playSurah(surah);
    }
  };

  return (
    <div className="py-2">
      {/* Section Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Surah Library
          </h3>
          <p className="text-[11px] text-slate-400">
            Stream or download all 114 Surahs with one tap
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          114 Surahs
        </span>
      </div>

      {/* Search Input */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Surah name, number, or meaning..."
            className="w-full bg-[#111827] text-white placeholder-slate-500 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs (Interactive segmented control) */}
      <div className="px-4 mb-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-white/[0.05] text-slate-400 hover:text-white'
          }`}
        >
          All (114)
        </button>
        <button
          onClick={() => setFilterType('Meccan')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            filterType === 'Meccan'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-white/[0.05] text-slate-400 hover:text-white'
          }`}
        >
          Meccan (86)
        </button>
        <button
          onClick={() => setFilterType('Medinan')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            filterType === 'Medinan'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-white/[0.05] text-slate-400 hover:text-white'
          }`}
        >
          Medinan (28)
        </button>
        <button
          onClick={() => setFilterType('downloaded')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            filterType === 'downloaded'
              ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
              : downloadedCount > 0
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/[0.05] text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Downloaded ({downloadedCount})</span>
        </button>
      </div>

      {/* Surah List Items */}
      <div className="px-4 space-y-2">
        {filteredSurahs.map((surah) => {
          const isCurrentActive = currentSurah.number === surah.number;
          const isCurrentPlaying = isCurrentActive && isPlaying;

          return (
            <SurahListTile
              key={surah.number}
              surah={surah}
              reciter={currentReciter}
              isActive={isCurrentActive}
              isPlaying={isCurrentPlaying}
              onSelect={handleSurahClick}
            />
          );
        })}

        {filteredSurahs.length === 0 && (
          <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            {filterType === 'downloaded' ? (
              <>
                <ArrowDownCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-white">No Downloaded Surahs Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tap the download icon beside any Surah to save it for seamless, data-free offline listening.
                </p>
              </>
            ) : (
              <>
                <Compass className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Surahs found</p>
                <p className="text-xs text-slate-500 mt-1">Try searching with a different name or number</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

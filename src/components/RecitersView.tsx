import React, { useState } from 'react';
import { Search, Play, Pause, Radio, Check } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { RECITERS, SURAHS, Reciter } from '../data/quranData';

export const RecitersView: React.FC = () => {
  const { currentReciter, selectReciter, playSurah, isPlaying } = useAudio();
  const [search, setSearch] = useState('');

  const filtered = RECITERS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.arabicName.includes(search) ||
      r.country.toLowerCase().includes(search.toLowerCase()) ||
      r.style.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlayReciter = (reciter: Reciter) => {
    selectReciter(reciter);
    playSurah(SURAHS[0], reciter);
  };

  return (
    <div className="py-3 px-4">
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Quran Reciters (القرّاء)
        </h2>
        <p className="text-xs text-slate-400">
          Listen to world-renowned Qaris with authentic Riwayat
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reciter by name, style, or country..."
          className="w-full bg-[#111827] text-white placeholder-slate-500 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-white/[0.08] focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Reciters Grid */}
      <div className="space-y-3">
        {filtered.map((reciter) => {
          const isSelected = reciter.id === currentReciter.id;
          const isCurrentPlaying = isSelected && isPlaying;

          return (
            <div
              key={reciter.id}
              onClick={() => handlePlayReciter(reciter)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg'
                  : 'bg-[#111827]/70 hover:bg-[#162032] border-white/[0.06]'
              }`}
            >
              {/* Avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${reciter.avatarColor} p-0.5 border-2 shrink-0 flex items-center justify-center text-white ${
                    isSelected ? 'border-emerald-400' : 'border-white/10'
                  }`}
                >
                  <span className="font-['Amiri'] text-lg font-bold">
                    {reciter.arabicName.split(' ')[0]}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isSelected ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {reciter.name}
                    </h4>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="font-['Amiri'] text-xs text-emerald-300/80">
                    {reciter.arabicName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {reciter.style} • {reciter.country}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <button
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/[0.05] text-slate-300 hover:text-white'
                  }`}
                >
                  {isCurrentPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-[1px]" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

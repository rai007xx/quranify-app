import React from 'react';
import { ChevronRight, Play, Star, Waves, Flower2, Moon } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SURAHS } from '../data/quranData';

interface PlaylistsPreviewProps {
  onViewAllPlaylists: () => void;
}

export const PlaylistsPreviewSection: React.FC<PlaylistsPreviewProps> = ({ onViewAllPlaylists }) => {
  const { playSurah } = useAudio();

  const previewItems = [
    {
      id: 'favourites',
      title: 'Favourites',
      subtitle: 'Daily gems',
      surahNum: 1,
      icon: Star,
      bg: 'from-amber-600/25 to-amber-950/20',
      border: 'border-amber-400/30',
      color: 'text-amber-400',
    },
    {
      id: 'focus',
      title: 'Focus & Work',
      subtitle: 'Deep calm',
      surahNum: 55,
      icon: Waves,
      bg: 'from-cyan-600/25 to-blue-950/20',
      border: 'border-cyan-400/30',
      color: 'text-cyan-400',
    },
    {
      id: 'beautiful',
      title: 'Most Beautiful',
      subtitle: 'Timeless voices',
      surahNum: 19,
      icon: Flower2,
      bg: 'from-pink-600/25 to-fuchsia-950/20',
      border: 'border-pink-400/30',
      color: 'text-pink-400',
    },
    {
      id: 'sleep',
      title: 'Sleep Mode',
      subtitle: 'Night serenity',
      surahNum: 67,
      icon: Moon,
      bg: 'from-indigo-600/25 to-slate-950/20',
      border: 'border-indigo-400/30',
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="py-2 px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          Playlists
        </h3>
        <button
          onClick={onViewAllPlaylists}
          className="text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <span>See all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {previewItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                const s = SURAHS.find((surah) => surah.number === item.surahNum) || SURAHS[0];
                playSurah(s);
              }}
              className={`p-3 rounded-2xl bg-gradient-to-br ${item.bg} bg-[#0E1524] border ${item.border} text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-between gap-2 shadow-md group gpu-accelerated`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center ${item.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="w-6 h-6 rounded-full bg-white/[0.08] group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-slate-300 transition-all shrink-0">
                <Play className="w-3 h-3 fill-current translate-x-[0.5px]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

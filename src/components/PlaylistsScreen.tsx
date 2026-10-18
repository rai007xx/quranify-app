import React, { useState, useEffect } from 'react';
import { Play, Star, Waves, Flower2, Moon, Sparkles, Heart, Compass, Download, HardDrive, ChevronRight } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SURAHS } from '../data/quranData';
import { downloadService, DownloadedSurahMeta } from '../services/downloadService';
import { DownloadsScreen } from './DownloadsScreen';

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  surahNumber: number;
  badge: string;
  gradient: string;
  border: string;
  icon: any;
  patternSvg: React.ReactNode;
}

export const PlaylistsScreen: React.FC = () => {
  const { playSurah } = useAudio();

  const categories: CategoryCard[] = [
    {
      id: 'favourites',
      title: 'Favourites',
      subtitle: 'Your curated daily Quran gems',
      surahNumber: 1, // Al-Fatihah
      badge: 'Golden Glow',
      gradient: 'from-amber-500/25 via-amber-700/20 to-[#0A0E17]',
      border: 'border-amber-400/30 hover:border-amber-400/60',
      icon: Star,
      patternSvg: (
        <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="starGlow" cx="70%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#starGlow)" />
          {/* Subtle star lattice */}
          <path d="M120 20 L125 35 L140 35 L128 45 L132 60 L120 50 L108 60 L112 45 L100 35 L115 35 Z" fill="#FBBF24" opacity="0.3" />
          <path d="M50 80 L53 89 L62 89 L55 95 L57 104 L50 98 L43 104 L45 95 L38 89 L47 89 Z" fill="#FBBF24" opacity="0.25" />
        </svg>
      ),
    },
    {
      id: 'focus_work',
      title: 'Focus & Work',
      subtitle: 'Calm recitations for deep concentration',
      surahNumber: 55, // Ar-Rahman
      badge: 'Concentric Waves',
      gradient: 'from-cyan-600/25 via-blue-900/20 to-[#0A0E17]',
      border: 'border-cyan-400/30 hover:border-cyan-400/60',
      icon: Waves,
      patternSvg: (
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="85%" cy="30%" r="30" stroke="#38BDF8" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="85%" cy="30%" r="55" stroke="#38BDF8" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="85%" cy="30%" r="80" stroke="#38BDF8" strokeWidth="1" fill="none" opacity="0.3" />
          <circle cx="85%" cy="30%" r="105" stroke="#38BDF8" strokeWidth="1" fill="none" opacity="0.15" />
        </svg>
      ),
    },
    {
      id: 'most_beautiful',
      title: 'Most Beautiful',
      subtitle: 'Masterpiece Maqamat & timeless voices',
      surahNumber: 19, // Maryam
      badge: 'Sacred Floral',
      gradient: 'from-pink-600/25 via-fuchsia-950/20 to-[#0A0E17]',
      border: 'border-pink-400/30 hover:border-pink-400/60',
      icon: Flower2,
      patternSvg: (
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Sacred geometry petals */}
          <g transform="translate(130, 40) scale(0.6)">
            <ellipse cx="0" cy="-30" rx="14" ry="28" fill="#F472B6" opacity="0.4" />
            <ellipse cx="0" cy="30" rx="14" ry="28" fill="#F472B6" opacity="0.4" />
            <ellipse cx="-30" cy="0" rx="28" ry="14" fill="#F472B6" opacity="0.4" />
            <ellipse cx="30" cy="0" rx="28" ry="14" fill="#F472B6" opacity="0.4" />
            <circle cx="0" cy="0" r="12" fill="#EC4899" opacity="0.6" />
          </g>
        </svg>
      ),
    },
    {
      id: 'sleep_mode',
      title: 'Sleep Mode',
      subtitle: 'Gentle night soothing recitations',
      surahNumber: 67, // Al-Mulk
      badge: 'Night Serenity',
      gradient: 'from-indigo-600/25 via-slate-900/40 to-[#0A0E17]',
      border: 'border-indigo-400/30 hover:border-indigo-400/60',
      icon: Moon,
      patternSvg: (
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Crescent Moon & night stars */}
          <path d="M125 25 A22 22 0 1 0 155 55 A28 28 0 1 1 125 25 Z" fill="#818CF8" opacity="0.5" />
          <circle cx="60" cy="30" r="1.5" fill="#C7D2FE" opacity="0.6" />
          <circle cx="90" cy="65" r="1.5" fill="#C7D2FE" opacity="0.8" />
          <circle cx="45" cy="85" r="1" fill="#C7D2FE" opacity="0.4" />
        </svg>
      ),
    },
    {
      id: 'duaa_ruqia',
      title: 'Duaa & Ruqia',
      subtitle: 'Spiritual healing & steadfast protection',
      surahNumber: 112, // Al-Ikhlas / Muawwidhat
      badge: 'Sage Linear Rays',
      gradient: 'from-emerald-600/25 via-teal-950/20 to-[#0A0E17]',
      border: 'border-emerald-400/30 hover:border-emerald-400/60',
      icon: Sparkles,
      patternSvg: (
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <line x1="80" y1="0" x2="160" y2="100" stroke="#34D399" strokeWidth="1.2" opacity="0.5" />
          <line x1="100" y1="0" x2="180" y2="100" stroke="#34D399" strokeWidth="1" opacity="0.4" />
          <line x1="120" y1="0" x2="200" y2="100" stroke="#34D399" strokeWidth="0.8" opacity="0.3" />
          <line x1="140" y1="0" x2="220" y2="100" stroke="#34D399" strokeWidth="0.6" opacity="0.2" />
        </svg>
      ),
    },
    {
      id: 'emotional',
      title: 'Emotional Recitations',
      subtitle: 'Deeply moving verses that shake the soul',
      surahNumber: 36, // Ya-Sin
      badge: 'Purple Motif',
      gradient: 'from-purple-600/25 via-violet-950/20 to-[#0A0E17]',
      border: 'border-purple-400/30 hover:border-purple-400/60',
      icon: Heart,
      patternSvg: (
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Islamic octagram / floral star */}
          <g transform="translate(130, 45) scale(0.55)">
            <rect x="-25" y="-25" width="50" height="50" fill="none" stroke="#A78BFA" strokeWidth="2" opacity="0.5" />
            <rect x="-25" y="-25" width="50" height="50" fill="none" stroke="#A78BFA" strokeWidth="2" opacity="0.5" transform="rotate(45)" />
            <circle cx="0" cy="0" r="14" fill="#C084FC" opacity="0.4" />
          </g>
        </svg>
      ),
    },
  ];

  const [isDownloadsViewOpen, setIsDownloadsViewOpen] = useState(false);
  const [downloadedList, setDownloadedList] = useState<DownloadedSurahMeta[]>(() =>
    downloadService.getDownloadedList()
  );

  useEffect(() => {
    setDownloadedList(downloadService.getDownloadedList());
    const unsub = downloadService.subscribeList((list) => {
      setDownloadedList(list);
    });
    return unsub;
  }, []);

  const totalBytes = downloadedList.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  const handleCardClick = (surahNumber: number) => {
    const targetSurah = SURAHS.find((s) => s.number === surahNumber) || SURAHS[0];
    playSurah(targetSurah);
  };

  if (isDownloadsViewOpen) {
    return <DownloadsScreen onBack={() => setIsDownloadsViewOpen(false)} />;
  }

  return (
    <div className="py-3 px-4">
      {/* Prominent Downloads / Offline Library Tile */}
      <div
        onClick={() => setIsDownloadsViewOpen(true)}
        className="mb-5 p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0E1726] to-[#0A0E17] border border-emerald-500/30 hover:border-emerald-500/60 shadow-xl shadow-emerald-950/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0 shadow-inner">
            <Download className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                Downloaded Recitations
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Offline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
              {downloadedList.length > 0 ? (
                <>
                  <span className="font-semibold text-slate-300">
                    {downloadedList.length} {downloadedList.length === 1 ? 'Surah' : 'Surahs'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-medium">{totalMB} MB</span>
                  <span className="text-slate-500">stored on device</span>
                </>
              ) : (
                <span>No downloaded Surahs yet • Tap to view offline library</span>
              )}
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/[0.06] group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Playlists & Themes
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
            6 Collections
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Curated listening experiences designed for daily reflection and tranquility
        </p>
      </div>

      {/* 2-Column Grid of Modern Category Cards matching screenshot */}
      <div className="grid grid-cols-2 gap-3.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCardClick(cat.surahNumber)}
              className={`relative group overflow-hidden rounded-3xl p-4 text-left border ${cat.border} bg-gradient-to-br ${cat.gradient} bg-[#0C1220] shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[145px] flex flex-col justify-between gpu-accelerated`}
            >
              {/* Custom SVG Geometric Canvas Background */}
              {cat.patternSvg}

              {/* Top Row: Icon + Play Button */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-white shadow-sm">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-full bg-white/[0.1] group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center text-white transition-all shadow-md">
                  <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" />
                </div>
              </div>

              {/* Bottom Details */}
              <div className="relative z-10 mt-3">
                <h3 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-tight mt-1 line-clamp-2">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recommended Surahs quick ribbon */}
      <div className="mt-6 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Key Recitations in this Collection
          </h4>
          <span className="text-[11px] text-emerald-400 font-semibold">Surah 1, 18, 19, 36, 55, 67</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { num: 1, name: 'Al-Fatihah' },
            { num: 18, name: 'Al-Kahf' },
            { num: 36, name: 'Ya-Sin' },
            { num: 55, name: 'Ar-Rahman' },
            { num: 67, name: 'Al-Mulk' },
            { num: 112, name: 'Al-Ikhlas' },
          ].map((item) => (
            <button
              key={item.num}
              onClick={() => handleCardClick(item.num)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

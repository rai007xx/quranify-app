import React from 'react';
import { Play, Sparkles, Moon, Sun, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SURAHS } from '../data/quranData';

export const PlaylistsView: React.FC = () => {
  const { playSurah } = useAudio();

  const curatedPlaylists = [
    {
      id: 'friday',
      title: 'Friday Sunnah: Surah Al-Kahf',
      arabic: 'سورة الكهف',
      description: 'The light between two Fridays - Full recitation of Surah 18.',
      surahNumber: 18,
      icon: Sparkles,
      color: 'from-amber-600/30 to-emerald-600/30',
      border: 'border-amber-500/30',
      count: '110 Verses',
    },
    {
      id: 'night',
      title: 'Night Protection: Surah Al-Mulk & As-Sajdah',
      arabic: 'الملك و السجدة',
      description: 'Intercessor in the grave and protection before sleeping.',
      surahNumber: 67,
      icon: Moon,
      color: 'from-indigo-600/30 to-blue-600/30',
      border: 'border-indigo-500/30',
      count: '30 Verses',
    },
    {
      id: 'blessing',
      title: 'Divine Mercy: Surah Ar-Rahman & Al-Waqiah',
      arabic: 'الرحمن و الواقعة',
      description: 'Which of the favors of your Lord will you deny?',
      surahNumber: 55,
      icon: HeartHandshake,
      color: 'from-teal-600/30 to-emerald-600/30',
      border: 'border-teal-500/30',
      count: '78 Verses',
    },
    {
      id: 'protection',
      title: 'Daily Mu’awwidhatayn & Al-Ikhlas',
      arabic: 'المعوذات و الإخلاص',
      description: 'Surahs Al-Ikhlas, Al-Falaq, and An-Nas for complete refuge.',
      surahNumber: 112,
      icon: ShieldCheck,
      color: 'from-emerald-600/30 to-green-600/30',
      border: 'border-emerald-500/30',
      count: '3 Short Surahs',
    },
    {
      id: 'morning',
      title: 'Heart of the Quran: Surah Ya-Sin',
      arabic: 'سورة يس',
      description: 'Spiritual uplifting and comfort for the soul.',
      surahNumber: 36,
      icon: Sun,
      color: 'from-sky-600/30 to-indigo-600/30',
      border: 'border-sky-500/30',
      count: '83 Verses',
    },
  ];

  const handlePlayPlaylist = (surahNumber: number) => {
    const surah = SURAHS.find((s) => s.number === surahNumber);
    if (surah) {
      playSurah(surah);
    }
  };

  return (
    <div className="py-3 px-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Curated Playlists (المجموعات)
        </h2>
        <p className="text-xs text-slate-400">
          Selected recitations for daily reflection and Sunnah routines
        </p>
      </div>

      <div className="space-y-3">
        {curatedPlaylists.map((pl) => {
          const Icon = pl.icon;
          return (
            <div
              key={pl.id}
              onClick={() => handlePlayPlaylist(pl.surahNumber)}
              className={`p-4 rounded-2xl bg-gradient-to-r ${pl.color} bg-[#111827]/80 border ${pl.border} transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 shadow-lg`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center text-emerald-300 shrink-0 border border-white/[0.1]">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">
                    {pl.title}
                  </h4>
                  <p className="font-['Amiri'] text-xs text-emerald-300">
                    {pl.arabic}
                  </p>
                  <p className="text-[11px] text-slate-300/80 truncate mt-0.5">
                    {pl.description}
                  </p>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold mt-1 inline-block">
                    {pl.count}
                  </span>
                </div>
              </div>

              <button
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all shrink-0 shadow-md shadow-emerald-500/25"
                title="Play Playlist"
              >
                <Play className="w-4 h-4 fill-slate-950 translate-x-[1px]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

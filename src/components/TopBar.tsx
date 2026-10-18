import React from 'react';
import { BookOpen } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export const TopBar: React.FC = () => {
  const { isPlaying } = useAudio();

  return (
    <header className="sticky top-0 z-30 bg-[#070B14] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between shrink-0 gpu-accelerated">
      {/* Brand Zone */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-inner">
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
              Al-Quran
            </h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              100% Free
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Listen & Stream Pure Recitation
          </p>
        </div>
      </div>

      {/* Right Zone: Pure Animated Equalizer Visualizer */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-end gap-[3px] h-7 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]"
          title={isPlaying ? "Quran audio playing" : "Quran audio paused"}
        >
          <span className={`w-[3px] bg-emerald-400 rounded-full transition-all duration-300 ${isPlaying ? 'h-4 animate-pulse' : 'h-1.5'}`} />
          <span className={`w-[3px] bg-emerald-400 rounded-full transition-all duration-200 ${isPlaying ? 'h-5 animate-bounce' : 'h-2.5'}`} style={{ animationDelay: '120ms' }} />
          <span className={`w-[3px] bg-emerald-400 rounded-full transition-all duration-300 ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} style={{ animationDelay: '240ms' }} />
          <span className={`w-[3px] bg-emerald-400 rounded-full transition-all duration-250 ${isPlaying ? 'h-5 animate-bounce' : 'h-3'}`} style={{ animationDelay: '360ms' }} />
        </div>
      </div>
    </header>
  );
};

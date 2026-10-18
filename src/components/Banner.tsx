import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

interface BannerProps {
  onExplore: () => void;
}

export const Banner: React.FC<BannerProps> = ({ onExplore }) => {
  return (
    <div className="px-4 py-2">
      <button
        onClick={onExplore}
        className="w-full text-left group relative overflow-hidden rounded-2xl p-[1px] transition-transform active:scale-[0.99] cursor-pointer"
      >
        {/* Glow border gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-sky-500/20 to-teal-500/30 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity" />

        <div className="relative bg-[#0F172A] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-white/[0.08] gpu-accelerated">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                New reciters added • Tap to explore
              </p>
              <p className="text-[11px] text-slate-400">
                10+ world-class Qaris with crystal-clear audio
              </p>
            </div>
          </div>

          <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/[0.1] transition-all shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </button>
    </div>
  );
};

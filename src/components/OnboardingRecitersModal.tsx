import React, { useState, useEffect } from 'react';
import { Check, Sparkles, BookOpen, ChevronRight, Heart } from 'lucide-react';
import { RECITERS, Reciter } from '../data/quranData';
import { useAudio } from '../context/AudioContext';
import { ReciterAvatar } from './ReciterAvatar';

interface OnboardingRecitersModalProps {
  forceOpen?: boolean;
  onComplete?: () => void;
}

const ONBOARDING_COMPLETED_KEY = 'quran_app_is_first_launch_done_v1';

export const OnboardingRecitersModal: React.FC<OnboardingRecitersModalProps> = ({
  forceOpen = false,
  onComplete,
}) => {
  const { favoriteReciterIds, toggleFavoriteReciter, showToast, selectReciter } = useAudio();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setSelectedIds(favoriteReciterIds.length > 0 ? favoriteReciterIds : ['yasser', 'afs', 'maher']);
      return;
    }

    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!completed) {
      // First launch detected!
      setIsOpen(true);
      // Pre-select popular reciters
      setSelectedIds(['yasser', 'afs', 'maher', 'basit']);
    }
  }, [forceOpen, favoriteReciterIds]);

  if (!isOpen) return null;

  const toggleSelection = (reciterId: string) => {
    setSelectedIds((prev) =>
      prev.includes(reciterId)
        ? prev.filter((id) => id !== reciterId)
        : [...prev, reciterId]
    );
  };

  const handleContinue = () => {
    const finalSelected = selectedIds.length > 0 ? selectedIds : ['yasser', 'afs'];

    // Update favorites in AudioContext
    finalSelected.forEach((id) => {
      if (!favoriteReciterIds.includes(id)) {
        toggleFavoriteReciter(id);
      }
    });

    // Pick first selected as active reciter
    const firstReciter = RECITERS.find((r) => r.id === finalSelected[0]) || RECITERS[0];
    selectReciter(firstReciter);

    // Save flag to localStorage
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOpen(false);
    showToast(`Welcome! ${finalSelected.length} favourite reciters added to your feed.`);
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-300">
      <div className="w-full max-w-lg h-full sm:h-[90vh] bg-[#070B14] sm:border sm:border-white/10 sm:rounded-[36px] flex flex-col justify-between overflow-hidden shadow-2xl gpu-accelerated">
        {/* Header */}
        <div className="p-6 pb-3 text-center shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-[#0F172A]/80 to-transparent">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(52,211,153,0.25)]">
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            Welcome to Al-Quran
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-2 font-['Plus_Jakarta_Sans']">
            Choose Your Favourite Reciters
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Select your preferred Qaris to personalize your daily feed and audio carousels.
          </p>
        </div>

        {/* Scrollable Reciters Grid with 90Hz/120Hz native inertia */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 smooth-scroll gpu-accelerated">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {RECITERS.map((reciter) => {
              const isSelected = selectedIds.includes(reciter.id);

              return (
                <div
                  key={reciter.id}
                  onClick={() => toggleSelection(reciter.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all duration-200 flex flex-col items-center text-center cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.2)] ring-1 ring-emerald-400/40'
                      : 'bg-[#0E1524]/80 hover:bg-[#131C2E] border-white/[0.08]'
                  }`}
                >
                  {/* Selection Checkmark Badge */}
                  <div
                    className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                        : 'bg-white/10 text-transparent border border-white/20'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  {/* Real Portrait Circular Avatar */}
                  <div className="p-1 rounded-full relative mb-2">
                    <ReciterAvatar
                      reciter={reciter}
                      size="md"
                      className={`ring-2 transition-all ${
                        isSelected ? 'ring-emerald-400 scale-105' : 'ring-white/20 group-hover:ring-white/40'
                      }`}
                    />
                  </div>

                  {/* Reciter Name & Arabic */}
                  <p
                    className={`text-xs font-bold leading-tight truncate w-full ${
                      isSelected ? 'text-emerald-300' : 'text-white'
                    }`}
                  >
                    {reciter.name}
                  </p>
                  <p className="font-['Amiri'] text-xs text-slate-400 mt-0.5 truncate w-full">
                    {reciter.arabicName}
                  </p>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono uppercase">
                    {reciter.country}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Floating Action Bar */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#070B14] shrink-0 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-xs font-bold text-white">
              {selectedIds.length} Reciters Selected
            </span>
            <p className="text-[10px] text-slate-400">
              You can change this anytime from Settings
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_25px_rgba(52,211,153,0.4)] cursor-pointer group"
          >
            <span>Continue to Al-Quran</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

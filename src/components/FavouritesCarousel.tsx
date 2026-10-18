import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { RECITERS, Reciter } from '../data/quranData';
import { ReciterAvatarCard } from './ReciterAvatarCard';

interface FavouritesCarouselProps {
  onSelectReciter?: (reciter: Reciter) => void;
  onExploreMore?: () => void;
}

export const FavouritesCarousel: React.FC<FavouritesCarouselProps> = ({
  onSelectReciter,
  onExploreMore,
}) => {
  const {
    currentReciter,
    selectReciter,
    isPlaying,
    favoriteReciterIds,
    toggleFavoriteReciter,
  } = useAudio();

  const favReciters = RECITERS.filter((r) => favoriteReciterIds.includes(r.id));

  const handleReciterClick = (reciter: Reciter) => {
    selectReciter(reciter);
    if (onSelectReciter) onSelectReciter(reciter);
  };

  return (
    <div className="py-2">
      {/* Header */}
      <div className="px-4 mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <h3 className="text-sm font-bold text-white tracking-tight">Your favourites</h3>
        </div>
        {onExploreMore && (
          <button
            onClick={onExploreMore}
            className="text-[11px] font-semibold text-[#00E676] hover:text-[#38EF7D] transition-colors cursor-pointer"
          >
            Explore all
          </button>
        )}
      </div>

      {/* Clean horizontal scrolling row with 90Hz/120Hz native inertia */}
      <div className="flex items-start gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-none smooth-scroll gpu-accelerated">
        {favReciters.map((reciter) => {
          const isSelected = reciter.id === currentReciter.id;

          return (
            <ReciterAvatarCard
              key={reciter.id}
              id={reciter.id}
              name={reciter.name}
              photoUrl={reciter.photoUrl}
              isSelected={isSelected}
              isFavorite={true}
              isPlaying={isSelected && isPlaying}
              onTap={() => handleReciterClick(reciter)}
              onToggleFavorite={() => toggleFavoriteReciter(reciter.id)}
            />
          );
        })}

        {/* Add more reciters button */}
        {onExploreMore && (
          <button
            onClick={onExploreMore}
            className="flex flex-col items-center justify-center shrink-0 w-[88px] group cursor-pointer pt-0.5"
          >
            <div className="w-[68px] h-[68px] rounded-full border border-dashed border-white/20 hover:border-[#00E676]/60 flex items-center justify-center text-slate-400 hover:text-[#00E676] bg-white/[0.02] hover:bg-[#00E676]/10 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[12px] text-slate-400 mt-2 font-medium group-hover:text-white transition-colors text-center leading-[1.2]">
              Add Qari
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { getReciterPhotoUrl } from '../services/reciterImageService';

export interface ReciterAvatarCardProps {
  id?: string;
  name: string;
  photoUrl: string;
  onTap?: () => void;
  isSelected?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  badge?: string;
  badgeColor?: string;
  isPlaying?: boolean;
  className?: string;
  subtitle?: string;
}

export const ReciterAvatarCard: React.FC<ReciterAvatarCardProps> = ({
  id,
  name,
  photoUrl,
  onTap,
  isSelected = false,
  isFavorite = false,
  onToggleFavorite,
  isPlaying = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Resolve verified public portrait URL
  const resolvedPhoto = photoUrl || getReciterPhotoUrl(id || '', name);

  return (
    <div
      className={`flex flex-col items-center shrink-0 group select-none w-[88px] ${className}`}
    >
      {/* 68x68 (radius 34) Circular Avatar Container */}
      <div className="relative">
        <button
          onClick={onTap}
          type="button"
          aria-label={`Select reciter ${name}`}
          className={`relative w-[68px] h-[68px] rounded-full p-0 transition-all duration-300 cursor-pointer block focus:outline-none ${
            isSelected
              ? 'ring-2 ring-[#00E676] ring-offset-2 ring-offset-[#05090F] shadow-[0_0_15px_rgba(0,230,118,0.35)] scale-105'
              : 'hover:scale-102 hover:border-[#00E676]/40'
          }`}
        >
          {/* Circular 68x68 avatar with subtle 1.5px frosted white border */}
          <div className="w-[68px] h-[68px] rounded-full overflow-hidden bg-[#0B1017] border-[1.5px] border-white/[0.12] shadow-md relative">
            {!isLoaded && !imageError && (
              <div className="absolute inset-0 bg-slate-900/80 animate-pulse rounded-full" />
            )}

            {!imageError ? (
              <img
                src={resolvedPhoto}
                alt={name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => setIsLoaded(true)}
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover object-top rounded-full transition-all duration-300 group-hover:scale-105 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              /* AMOLED Dark Fallback Initial */
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#131D2E] to-[#070B11] flex items-center justify-center">
                <span className="font-['Amiri'] font-bold text-[#00E676] text-lg">
                  {name.charAt(0)}
                </span>
              </div>
            )}

            {/* Active Equalizer Ring when playing */}
            {isSelected && isPlaying && (
              <div className="absolute inset-0 bg-[#0B1A14]/90 rounded-full flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] bg-[#00E676] rounded-full animate-pulse h-2.5" />
                  <span className="w-[2px] bg-[#00E676] rounded-full animate-bounce h-3" />
                  <span className="w-[2px] bg-[#00E676] rounded-full animate-pulse h-2" />
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Floating translucent heart badge at the top-right corner of each avatar */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            type="button"
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#131B29] border border-white/20 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg z-10"
            title={isFavorite ? 'Remove favourite' : 'Add to favourites'}
          >
            <Heart
              className={`w-3 h-3 transition-colors ${
                isFavorite
                  ? 'fill-rose-500 stroke-rose-400 text-rose-500'
                  : 'text-white/60 hover:text-white'
              }`}
            />
          </button>
        )}
      </div>

      {/* Full Reciter Name below in 2-line wrapped text layout */}
      <button
        onClick={onTap}
        type="button"
        className="mt-2 text-center w-full focus:outline-none cursor-pointer px-0.5"
      >
        <span
          className={`text-[12.5px] font-semibold tracking-[0.1px] block leading-[1.2] line-clamp-2 text-center transition-colors ${
            isSelected ? 'text-[#00E676]' : 'text-white group-hover:text-[#38EF7D]'
          }`}
          title={name}
        >
          {name}
        </span>
      </button>
    </div>
  );
};

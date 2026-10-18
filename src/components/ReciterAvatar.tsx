import React, { useState } from 'react';
import { Reciter } from '../data/quranData';
import { getReciterPhotoUrl, generateIslamicMedallionAvatar } from '../services/reciterImageService';

interface ReciterAvatarProps {
  reciter: Reciter;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showPlayingGlow?: boolean;
}

export const ReciterAvatar: React.FC<ReciterAvatarProps> = ({
  reciter,
  size = 'md',
  className = '',
  showPlayingGlow = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClasses = {
    xs: 'w-8 h-8 min-w-[2rem]',
    sm: 'w-11 h-11 min-w-[2.75rem]',
    md: 'w-16 h-16 min-w-[4rem]', // 64x64
    lg: 'w-[70px] h-[70px] min-w-[70px]', // 70x70 for hero card
    xl: 'w-32 h-32 min-w-[8rem]',
    '2xl': 'w-52 h-52 sm:w-60 sm:h-60 min-w-[13rem]',
  }[size];

  // Resolve authentic verified portrait URL
  const authenticPhotoUrl =
    reciter.photoUrl || getReciterPhotoUrl(reciter.id, reciter.name, reciter.arabicName);

  // Modern clean AMOLED dark initial fallback (NO orange/black dummy crests)
  const initialLetter = (reciter.arabicName || reciter.name || 'ق').trim().replace(/^ال/, '').charAt(0);

  return (
    <div
      className={`relative shrink-0 rounded-full select-none bg-[#0B1017] border-[1.5px] border-white/[0.12] shadow-md overflow-hidden ${sizeClasses} ${className}`}
    >
      {/* Loading Shimmer */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-900/80 animate-pulse rounded-full" />
      )}

      {/* Real Authentic Portrait */}
      {!hasError ? (
        <img
          src={authenticPhotoUrl}
          alt={reciter.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-top rounded-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        /* Clean AMOLED Dark Monogram Fallback */
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#121A26] to-[#070B11] flex items-center justify-center">
          <span className="font-['Amiri'] font-bold text-emerald-400 text-lg">
            {initialLetter}
          </span>
        </div>
      )}

      {/* Playing glow effect if requested */}
      {showPlayingGlow && (
        <div className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(0,208,132,0.4)]" />
      )}
    </div>
  );
};

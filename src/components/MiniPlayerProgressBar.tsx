import React, { useEffect, useState } from 'react';
import { audioProgressService } from '../services/audioProgressService';

export const MiniPlayerProgressBar: React.FC = () => {
  const [progress, setProgress] = useState<number>(() => audioProgressService.getProgress());

  useEffect(() => {
    return audioProgressService.subscribe((payload) => {
      setProgress(payload.progress);
    });
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06] overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#00E676] to-[#00B0FF] will-change-transform origin-left transition-transform duration-100 ease-linear"
        style={{
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
};

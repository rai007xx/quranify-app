import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioProgressService, AudioProgressPayload } from '../services/audioProgressService';
import { useAudio } from '../context/AudioContext';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const AudioSeekSlider: React.FC = () => {
  const { seek } = useAudio();
  const [progress, setProgress] = useState<AudioProgressPayload>(() =>
    audioProgressService.getCurrentPayload()
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    // Isolated subscription: updates ONLY this component at high frequency
    const unsubscribe = audioProgressService.subscribe((payload) => {
      if (!isDraggingRef.current) {
        setProgress(payload);
      }
    });

    return unsubscribe;
  }, []);

  const handleSeekStart = useCallback(() => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragTime(progress.currentTime);
  }, [progress.currentTime]);

  const handleSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setDragTime(val);
    },
    []
  );

  const handleSeekEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    seek(dragTime);
  }, [seek, dragTime]);

  const displayTime = isDragging ? dragTime : progress.currentTime;
  const maxDuration = progress.duration > 0 ? progress.duration : 100;
  const percentage = maxDuration > 0 ? (displayTime / maxDuration) * 100 : 0;

  return (
    <div className="mb-4 w-full select-none gpu-accelerated">
      {/* Range Slider Container with custom filled track */}
      <div className="relative flex items-center py-1">
        <input
          type="range"
          min={0}
          max={maxDuration}
          step={0.1}
          value={displayTime}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onChange={handleSeekChange}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E676] focus:outline-none transition-all"
          style={{
            background: `linear-gradient(to right, #00E676 0%, #00E676 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>

      {/* Timestamps */}
      <div className="flex justify-between items-center text-xs font-mono text-slate-400 mt-2 tabular-nums">
        <span className="font-semibold text-slate-300">{formatTime(displayTime)}</span>
        <span className="text-slate-500">{formatTime(progress.duration)}</span>
      </div>
    </div>
  );
};

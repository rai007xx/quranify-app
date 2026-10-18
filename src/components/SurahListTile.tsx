import React, { useState, useEffect } from 'react';
import { Play, Pause, ArrowDownCircle, CheckCircle2, Loader2, Trash2, X } from 'lucide-react';
import { Surah, Reciter } from '../data/quranData';
import { useAudio } from '../context/AudioContext';
import { downloadService } from '../services/downloadService';

interface SurahListTileProps {
  surah: Surah;
  reciter?: Reciter;
  isActive?: boolean;
  isPlaying?: boolean;
  onSelect: (surah: Surah) => void;
}

export const SurahListTile: React.FC<SurahListTileProps> = ({
  surah,
  reciter,
  isActive = false,
  isPlaying = false,
  onSelect,
}) => {
  const { currentReciter, showToast } = useAudio();
  const activeReciter = reciter || currentReciter;
  const key = downloadService.makeKey(activeReciter.id, surah.number);

  const [isDownloaded, setIsDownloaded] = useState<boolean>(() =>
    downloadService.isDownloaded(activeReciter.id, surah.number)
  );
  const [downloadProgress, setDownloadProgress] = useState<number | undefined>(() =>
    downloadService.getProgress(key)
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsDownloaded(downloadService.isDownloaded(activeReciter.id, surah.number));
    setDownloadProgress(downloadService.getProgress(key));

    const unsubscribe = downloadService.subscribe((updatedKey, progress) => {
      if (updatedKey === key) {
        if (progress >= 100) {
          setIsDownloaded(true);
          setDownloadProgress(undefined);
        } else if (progress < 0) {
          setDownloadProgress(undefined);
        } else {
          setDownloadProgress(progress);
        }
      }
    });

    return unsubscribe;
  }, [activeReciter.id, surah.number, key]);

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isDownloaded) {
      setShowDeleteConfirm(true);
      return;
    }

    if (downloadProgress !== undefined && downloadProgress > 0) {
      return; // Already downloading
    }

    showToast(`Downloading ${surah.name} for offline playback...`);
    const success = await downloadService.downloadSurah(surah, activeReciter);
    if (success) {
      setIsDownloaded(true);
      setDownloadProgress(undefined);
      showToast(`✓ ${surah.name} downloaded & saved offline!`);
    } else {
      showToast(`Download failed. Check your internet connection.`);
    }
  };

  const handleDeleteDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await downloadService.deleteDownloadedSurah(activeReciter.id, surah.number);
    setIsDownloaded(false);
    setShowDeleteConfirm(false);
    showToast(`Deleted ${surah.name} from offline cache`);
  };

  return (
    <div
      onClick={() => onSelect(surah)}
      className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer gpu-accelerated ${
        isActive
          ? 'bg-[#0F1E2E] border-[#00E676]/50 shadow-lg shadow-[#00E676]/10'
          : 'bg-[#0B1017] hover:bg-[#101724] border-[#182230]'
      }`}
    >
      {/* Left: Number & Titles */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
            isActive
              ? 'bg-[#00E676] text-black shadow-md shadow-[#00E676]/25'
              : 'bg-white/[0.05] text-slate-300 group-hover:bg-white/[0.08]'
          }`}
        >
          {surah.number}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold truncate ${
                isActive ? 'text-emerald-400 font-bold' : 'text-white'
              }`}
            >
              {surah.name}
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">
              • {surah.revelationType}
            </span>
            {isDownloaded && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0">
                Offline
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {surah.englishMeaning} • {surah.versesCount} verses
          </p>
        </div>
      </div>

      {/* Right: Arabic Name + One-Tap Download Button + Play Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="font-['Amiri'] text-base sm:text-lg font-bold text-slate-200">
          {surah.arabicName}
        </span>

        {/* Modern One-Tap Download Button */}
        <div className="relative">
          <button
            onClick={handleDownloadClick}
            type="button"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDownloaded
                ? 'text-emerald-400 bg-emerald-500/15 hover:bg-rose-500/20 hover:text-rose-400'
                : downloadProgress !== undefined
                ? 'text-amber-400 bg-amber-500/15'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.08]'
            }`}
            title={
              isDownloaded
                ? 'Downloaded offline • Tap to manage or delete'
                : downloadProgress !== undefined
                ? `Downloading: ${downloadProgress}%`
                : 'One-tap download for offline listening'
            }
          >
            {downloadProgress !== undefined ? (
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span className="sr-only">{downloadProgress}%</span>
              </div>
            ) : isDownloaded ? (
              <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
            ) : (
              <ArrowDownCircle className="w-5 h-5" />
            )}
          </button>

          {/* Quick Confirmation Popover to Delete Downloaded File */}
          {showDeleteConfirm && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-10 z-30 w-52 p-2.5 rounded-xl bg-[#0F1728] border border-white/15 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5">
                <span className="text-[11px] font-bold text-white">Downloaded Audio</span>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-300 mb-2 leading-relaxed">
                "{surah.name}" is stored locally for offline playback.
              </p>
              <button
                onClick={handleDeleteDownload}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Local Audio</span>
              </button>
            </div>
          )}
        </div>

        {/* Play/Pause Button */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isActive
              ? 'bg-emerald-500 text-slate-950 scale-105'
              : 'bg-white/[0.05] text-slate-400 group-hover:text-white group-hover:bg-white/[0.1]'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-[1px]" />
          )}
        </div>
      </div>
    </div>
  );
};

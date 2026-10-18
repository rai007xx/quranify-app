import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Play,
  Pause,
  Download,
  HardDrive,
  AlertTriangle,
  X,
  Sparkles,
  Music2,
} from 'lucide-react';
import { downloadService, DownloadedSurahMeta } from '../services/downloadService';
import { useAudio } from '../context/AudioContext';
import { SURAHS, RECITERS, Reciter } from '../data/quranData';
import { ReciterAvatar } from './ReciterAvatar';

interface DownloadsScreenProps {
  onBack?: () => void;
  onExploreSurahs?: () => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({
  onBack,
  onExploreSurahs,
}) => {
  const { currentSurah, currentReciter, isPlaying, playSurah, togglePlayPause, showToast } =
    useAudio();

  const [downloads, setDownloads] = useState<DownloadedSurahMeta[]>(() =>
    downloadService.getDownloadedList()
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DownloadedSurahMeta | null>(null);

  // Subscribe to real-time changes in downloaded library
  useEffect(() => {
    // Initial fetch
    setDownloads(downloadService.getDownloadedList());

    const unsubscribe = downloadService.subscribeList((newList) => {
      setDownloads(newList);
    });

    return unsubscribe;
  }, []);

  const totalBytes = downloads.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  const handlePlayItem = (item: DownloadedSurahMeta) => {
    const isThisTrackPlaying =
      currentSurah.number === item.surahNumber &&
      currentReciter.id === item.reciterId &&
      isPlaying;

    if (isThisTrackPlaying) {
      togglePlayPause();
      return;
    }

    const surahObj =
      SURAHS.find((s) => s.number === item.surahNumber) || {
        number: item.surahNumber,
        name: item.surahName,
        arabicName: item.arabicName,
        englishMeaning: 'Downloaded Recitation',
        versesCount: 0,
        revelationType: 'Meccan',
      };

    const reciterObj: Reciter =
      RECITERS.find((r) => r.id === item.reciterId) || {
        id: item.reciterId,
        name: item.reciterName,
        arabicName: item.arabicName,
        style: 'Hafs',
        photoUrl: item.reciterPhotoUrl,
        serverUrl: `https://server.mp3quran.net/${item.reciterId}/`,
        country: 'Global',
        avatarColor: 'from-emerald-700 to-teal-900',
        countryCategory: 'Other',
      };

    playSurah(surahObj, reciterObj);
  };

  const handleDeleteItem = async (item: DownloadedSurahMeta) => {
    await downloadService.deleteDownloadedSurah(item.reciterId, item.surahNumber);
    setItemToDelete(null);
    showToast(`Removed ${item.surahName} from offline storage`);
  };

  const handleClearAll = async () => {
    await downloadService.clearAllDownloads();
    setShowClearConfirm(false);
    showToast('All downloaded Surahs removed from device');
  };

  return (
    <div className="py-2 px-4 pb-28 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pt-1">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                Downloaded Recitations
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                Offline Library
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {downloads.length} {downloads.length === 1 ? 'Surah' : 'Surahs'} • {totalMB} MB storage used
              </span>
            </p>
          </div>
        </div>

        {/* Clear All Button */}
        {downloads.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {downloads.length === 0 ? (
        <div className="mt-8 mx-auto max-w-md p-8 rounded-3xl bg-gradient-to-b from-[#111827] to-[#0A0E17] border border-white/[0.08] text-center shadow-xl gpu-accelerated">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner mb-4">
            <Download className="w-10 h-10 stroke-[1.6]" />
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">
            No downloaded Surahs yet
          </h3>

          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Download your favourite recitations to listen offline without internet.
            Tap the download button next to any Surah.
          </p>

          {onExploreSurahs && (
            <button
              onClick={onExploreSurahs}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore 114 Surahs</span>
            </button>
          )}
        </div>
      ) : (
        /* Downloaded Recitations List */
        <div className="space-y-2.5">
          {downloads.map((item) => {
            const isThisPlaying =
              currentSurah.number === item.surahNumber &&
              currentReciter.id === item.reciterId &&
              isPlaying;

            const isCurrentTrack =
              currentSurah.number === item.surahNumber &&
              currentReciter.id === item.reciterId;

            const fileSizeMB = (item.sizeBytes / (1024 * 1024)).toFixed(1);

            const itemReciter: Reciter =
              RECITERS.find((r) => r.id === item.reciterId) || {
                id: item.reciterId,
                name: item.reciterName,
                arabicName: item.arabicName,
                style: 'Hafs',
                photoUrl: item.reciterPhotoUrl,
                serverUrl: `https://server.mp3quran.net/${item.reciterId}/`,
                country: 'Global',
                avatarColor: 'from-emerald-700 to-teal-900',
                countryCategory: 'Other',
              };

            return (
              <div
                key={item.key}
                onClick={() => handlePlayItem(item)}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrentTrack
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : 'bg-[#0E1526]/80 hover:bg-[#131C33] border-white/[0.07]'
                }`}
              >
                {/* Left: Number circle + Reciter avatar + Surah Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Surah Number Circle Badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                      isCurrentTrack
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-white/[0.08] text-slate-300 group-hover:bg-white/[0.12]'
                    }`}
                  >
                    {item.surahNumber}
                  </div>

                  {/* Reciter Photo Avatar */}
                  <div className="shrink-0 relative">
                    <ReciterAvatar
                      reciter={itemReciter}
                      size="sm"
                      className="border border-white/10"
                    />
                  </div>

                  {/* Surah Name & Reciter Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCurrentTrack ? 'text-emerald-400 font-bold' : 'text-white'
                        }`}
                      >
                        {item.surahNumber}. {item.surahName}
                      </span>
                      <span className="text-xs text-slate-400 font-arabic font-medium truncate">
                        ({item.arabicName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="truncate max-w-[130px]">{item.reciterName}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400/90 font-medium">
                        {fileSizeMB} MB
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                        Offline
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Direct Play Button & Delete Button */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayItem(item);
                    }}
                    aria-label={isThisPlaying ? 'Pause' : 'Play'}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                      isThisPlaying
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 scale-105'
                        : 'bg-white/[0.08] hover:bg-emerald-500 hover:text-slate-950 text-white'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-[1px]" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(item);
                    }}
                    aria-label="Delete Download"
                    className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-red-500/15 border border-transparent hover:border-red-500/30 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog: Delete Single Download */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F1728] border border-white/10 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Download?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Remove <strong className="text-white">{itemToDelete.surahName}</strong> (by{' '}
              {itemToDelete.reciterName}) from your offline library? You can redownload it anytime.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(itemToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-600/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Clear All Downloads */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F1728] border border-red-500/20 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Clear All Downloads?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This will delete all <strong className="text-white">{downloads.length}</strong>{' '}
              downloaded recitations and free up{' '}
              <strong className="text-emerald-400">{totalMB} MB</strong> of storage.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-600/30"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

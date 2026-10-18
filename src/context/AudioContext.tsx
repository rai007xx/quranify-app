import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Surah, Reciter, SURAHS, RECITERS, getAudioUrl } from '../data/quranData';
import { offlineAudioService, CachedRecitationItem } from '../services/offlineAudioService';
import { listeningInsightsService, WeeklyDayStatus } from '../services/listeningInsightsService';
import { playbackHistoryService, PlaybackHistory } from '../services/playbackHistoryService';
import { audioProgressService } from '../services/audioProgressService';

interface AudioContextType {
  // Quran Recitation State
  currentSurah: Surah;
  currentReciter: Reciter;
  lastPlayback: PlaybackHistory | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  repeatMode: 'none' | 'one' | 'all';
  isMuted: boolean;
  quranVolume: number;

  // Offline Mode State
  isOfflineModeEnabled: boolean;
  isCurrentTrackCached: boolean;
  isCachingActive: boolean;
  cachingProgress: number;
  cachingStatusText: string;
  cachedItems: CachedRecitationItem[];
  totalCachedMB: number;
  isDeviceOnline: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  toggleOfflineMode: () => Promise<void>;
  cacheCurrentRecitation: () => Promise<boolean>;
  removeRecitationFromOffline: (reciterId: string, surahNumber: number) => Promise<void>;
  clearAllOfflineData: () => Promise<void>;

  // Timers & Favorites
  sleepTimerRemaining: number | null;
  favoriteReciterIds: string[];
  isReciterFavorite: (id: string) => boolean;
  toggleFavoriteReciter: (id: string) => void;

  // Actions
  playSurah: (surah: Surah, reciter?: Reciter, initialPosition?: number) => void;
  resumeLastPlayback: () => Promise<void>;
  selectReciter: (reciter: Reciter) => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  nextSurah: () => void;
  previousSurah: () => void;
  setSpeed: (speed: number) => void;
  toggleRepeat: () => void;
  setQuranVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  setSleepTimer: (minutes: number | null) => void;

  // Modals & Sheets
  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  profileReciter: Reciter | null;
  setProfileReciter: (r: Reciter | null) => void;

  // Real-Time Habit & Goal Stats
  todayListeningSeconds: number;
  todayListeningMinutes: number;
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (mins: number) => void;
  streakDays: number;
  bestStreakDays: number;
  thisWeekMinutes: number;
  weeklyDays: WeeklyDayStatus[];
  setTodayListeningSeconds: React.Dispatch<React.SetStateAction<number>>;
  setTodayListeningMinutes: React.Dispatch<React.SetStateAction<number>>;
  setStreakDays: React.Dispatch<React.SetStateAction<number>>;
  setBestStreakDays: React.Dispatch<React.SetStateAction<number>>;
  setWeeklyDays: React.Dispatch<React.SetStateAction<WeeklyDayStatus[]>>;
  setThisWeekMinutes: React.Dispatch<React.SetStateAction<number>>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'quran_app_fav_reciters_v2';
const INITIAL_FAVORITES = ['yussef', 'fatih', 'abdulrahman_suwayid', 'yasser', 'afs', 'maher', 'basit'];

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialHistory = playbackHistoryService.load();
  const [lastPlayback, setLastPlayback] = useState<PlaybackHistory | null>(initialHistory);

  const [currentSurah, setCurrentSurah] = useState<Surah>(() => {
    if (initialHistory) {
      const found = SURAHS.find((s) => s.number === initialHistory.surahNumber);
      if (found) return found;
    }
    return SURAHS[0]; // Al-Fatihah
  });

  const [currentReciter, setCurrentReciter] = useState<Reciter>(() => {
    if (initialHistory) {
      const found = RECITERS.find((r) => r.id === initialHistory.reciterId);
      if (found) return found;
    }
    return RECITERS.find((r) => r.id === 'yasser') || RECITERS[0];
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(() => {
    return initialHistory ? initialHistory.positionSeconds : 0;
  });
  const [duration, setDuration] = useState<number>(() => {
    return initialHistory ? initialHistory.totalDurationSeconds : 0;
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [quranVolume, setQuranVolume] = useState<number>(1.0);

  // Subscribe to playback history updates
  useEffect(() => {
    return playbackHistoryService.subscribe((h) => {
      setLastPlayback(h);
    });
  }, []);

  // Offline Mode & Caching State
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState<boolean>(() => {
    return offlineAudioService.isOfflineModeActive();
  });
  const [cachedItems, setCachedItems] = useState<CachedRecitationItem[]>(() => {
    return offlineAudioService.getCachedItems();
  });
  const [totalCachedMB, setTotalCachedMB] = useState<number>(() => {
    return offlineAudioService.getTotalCachedSizeMB();
  });
  const [isCurrentTrackCached, setIsCurrentTrackCached] = useState<boolean>(false);
  const [isCachingActive, setIsCachingActive] = useState<boolean>(false);
  const [cachingProgress, setCachingProgress] = useState<number>(0);
  const [cachingStatusText, setCachingStatusText] = useState<string>('');
  const [isDeviceOnline, setIsDeviceOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Panels
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [profileReciter, setProfileReciter] = useState<Reciter | null>(null);

  // Timers & Stats
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  
  // Real-time Habit & Insights State
  const [todayListeningSeconds, setTodayListeningSeconds] = useState<number>(() => {
    return listeningInsightsService.getTodayListeningSeconds();
  });
  const [todayListeningMinutes, setTodayListeningMinutes] = useState<number>(() => {
    return listeningInsightsService.getTodayListeningMinutes();
  });
  const [dailyGoalMinutes, setDailyGoalMinutesState] = useState<number>(() => {
    return listeningInsightsService.getDailyGoalMinutes();
  });
  const [streakDays, setStreakDays] = useState<number>(() => {
    return listeningInsightsService.getStreakDays();
  });
  const [bestStreakDays, setBestStreakDays] = useState<number>(() => {
    return listeningInsightsService.getBestStreakDays();
  });
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDayStatus[]>(() => {
    return listeningInsightsService.getWeeklyDaysStatus(listeningInsightsService.getDailyGoalMinutes());
  });
  const [thisWeekMinutes, setThisWeekMinutes] = useState<number>(() => {
    return listeningInsightsService.getThisWeekTotalMinutes(listeningInsightsService.getDailyGoalMinutes());
  });

  const setDailyGoalMinutes = (mins: number) => {
    listeningInsightsService.setDailyGoalMinutes(mins);
    setDailyGoalMinutesState(mins);
    setWeeklyDays(listeningInsightsService.getWeeklyDaysStatus(mins));
    setThisWeekMinutes(listeningInsightsService.getThisWeekTotalMinutes(mins));
  };

  // Real-time second-by-second listening duration tracker when actively playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const updatedMins = listeningInsightsService.addListeningSeconds(1);
      const updatedSecs = listeningInsightsService.getTodayListeningSeconds();
      setTodayListeningSeconds(updatedSecs);
      setTodayListeningMinutes(updatedMins);
      setStreakDays(listeningInsightsService.getStreakDays());
      setBestStreakDays(listeningInsightsService.getBestStreakDays());
      setWeeklyDays(listeningInsightsService.getWeeklyDaysStatus(dailyGoalMinutes));
      setThisWeekMinutes(listeningInsightsService.getThisWeekTotalMinutes(dailyGoalMinutes));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, dailyGoalMinutes]);

  // Persistent Favorites
  const [favoriteReciterIds, setFavoriteReciterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return INITIAL_FAVORITES;
  });

  // Single Audio Player dedicated to streaming Quran recitation
  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsDeviceOnline(true);
      showToast('Connection restored: Back online');
    };
    const handleOffline = () => {
      setIsDeviceOnline(false);
      showToast('Network disconnected: Switched to offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Check cache state whenever current track or reciter changes
  useEffect(() => {
    const isCached = offlineAudioService.isRecitationCached(currentReciter.id, currentSurah.number);
    setIsCurrentTrackCached(isCached);
  }, [currentSurah.number, currentReciter.id, cachedItems]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteReciterIds));
    } catch (_) {}
  }, [favoriteReciterIds]);

  const isReciterFavorite = (id: string) => favoriteReciterIds.includes(id);

  const toggleFavoriteReciter = (id: string) => {
    setFavoriteReciterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Initialize Single Quran Audio Player
  useEffect(() => {
    const quranAudio = new Audio();
    quranAudio.crossOrigin = 'anonymous';

    quranAudioRef.current = quranAudio;

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    const onTimeUpdate = () => {
      if (quranAudioRef.current) {
        const cur = quranAudioRef.current.currentTime;
        const dur = quranAudioRef.current.duration || 0;
        audioProgressService.notify(cur, dur);
      }
    };

    const onLoadedMetadata = () => {
      if (quranAudioRef.current) {
        const dur = quranAudioRef.current.duration || 0;
        setDuration(dur);
        audioProgressService.notify(quranAudioRef.current.currentTime, dur);
        setIsLoading(false);
      }
    };

    const onEnded = () => {
      handleAudioEnded();
    };

    const onError = (e: any) => {
      console.warn('Audio stream error/fallback triggered:', e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    quranAudio.addEventListener('play', onPlay);
    quranAudio.addEventListener('pause', onPause);
    quranAudio.addEventListener('waiting', onWaiting);
    quranAudio.addEventListener('canplay', onCanPlay);
    quranAudio.addEventListener('timeupdate', onTimeUpdate);
    quranAudio.addEventListener('loadedmetadata', onLoadedMetadata);
    quranAudio.addEventListener('ended', onEnded);
    quranAudio.addEventListener('error', onError);

    return () => {
      quranAudio.removeEventListener('play', onPlay);
      quranAudio.removeEventListener('pause', onPause);
      quranAudio.removeEventListener('waiting', onWaiting);
      quranAudio.removeEventListener('canplay', onCanPlay);
      quranAudio.removeEventListener('timeupdate', onTimeUpdate);
      quranAudio.removeEventListener('loadedmetadata', onLoadedMetadata);
      quranAudio.removeEventListener('ended', onEnded);
      quranAudio.removeEventListener('error', onError);
      quranAudio.pause();
    };
  }, []);

  // Volume & Speed Sync
  useEffect(() => {
    if (quranAudioRef.current) {
      quranAudioRef.current.volume = isMuted ? 0 : quranVolume;
    }
  }, [quranVolume, isMuted]);

  useEffect(() => {
    if (quranAudioRef.current) {
      quranAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    if (sleepTimerRemaining <= 0) {
      if (quranAudioRef.current) quranAudioRef.current.pause();
      setIsPlaying(false);
      setSleepTimerRemaining(null);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sleepTimerRemaining]);

  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      if (quranAudioRef.current) {
        quranAudioRef.current.currentTime = 0;
        quranAudioRef.current.play();
      }
    } else {
      nextSurah();
    }
  };

  /**
   * Play Surah with Offline Cache awareness and optional Auto-Resume Position
   */
  const playSurah = async (surah: Surah, reciter?: Reciter, initialPosition?: number) => {
    const activeReciter = reciter || currentReciter;
    setCurrentSurah(surah);
    if (reciter) setCurrentReciter(reciter);

    const originalUrl = getAudioUrl(activeReciter.serverUrl, surah.number);
    setIsLoading(true);

    // Retrieve cached playback URL (Blob URL from CacheStorage or online URL)
    const playbackUrl = await offlineAudioService.getPlaybackUrl(originalUrl);

    if (quranAudioRef.current) {
      quranAudioRef.current.src = playbackUrl;
      quranAudioRef.current.playbackRate = playbackSpeed;
      quranAudioRef.current.volume = isMuted ? 0 : quranVolume;

      if (initialPosition !== undefined && initialPosition > 0) {
        quranAudioRef.current.currentTime = initialPosition;
        setCurrentTime(initialPosition);
      }

      quranAudioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (initialPosition !== undefined && initialPosition > 0 && quranAudioRef.current) {
            quranAudioRef.current.currentTime = initialPosition;
          }
        })
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsLoading(false);
        });
    }
  };

  /**
   * Auto-Resume: Seeks directly to the last saved playback position and starts playing
   */
  const resumeLastPlayback = async () => {
    const history = playbackHistoryService.getHistory();
    if (history && history.positionSeconds > 0) {
      const targetSurah = SURAHS.find((s) => s.number === history.surahNumber) || currentSurah;
      const targetReciter = RECITERS.find((r) => r.id === history.reciterId) || currentReciter;
      await playSurah(targetSurah, targetReciter, history.positionSeconds);
    } else {
      togglePlayPause();
    }
  };

  // Periodic Auto-save playback position every 5 seconds while playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (quranAudioRef.current && currentSurah && currentReciter) {
        const cur = quranAudioRef.current.currentTime;
        const dur = quranAudioRef.current.duration || duration;
        if (cur > 0) {
          playbackHistoryService.save({
            surahNumber: currentSurah.number,
            surahName: currentSurah.name,
            arabicName: currentSurah.arabicName,
            reciterId: currentReciter.id,
            reciterName: currentReciter.name,
            reciterPhoto: currentReciter.photoUrl,
            positionSeconds: cur,
            totalDurationSeconds: dur,
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSurah, currentReciter, duration]);

  // Save on pause or before window unloads
  useEffect(() => {
    const handleSaveCurrent = () => {
      if (quranAudioRef.current && currentSurah && currentReciter) {
        const cur = quranAudioRef.current.currentTime;
        const dur = quranAudioRef.current.duration || duration;
        if (cur > 0) {
          playbackHistoryService.save({
            surahNumber: currentSurah.number,
            surahName: currentSurah.name,
            arabicName: currentSurah.arabicName,
            reciterId: currentReciter.id,
            reciterName: currentReciter.name,
            reciterPhoto: currentReciter.photoUrl,
            positionSeconds: cur,
            totalDurationSeconds: dur,
          });
        }
      }
    };

    if (!isPlaying) {
      handleSaveCurrent();
    }

    window.addEventListener('beforeunload', handleSaveCurrent);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleSaveCurrent();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleSaveCurrent);
    };
  }, [isPlaying, currentSurah, currentReciter, duration]);

  const selectReciter = (reciter: Reciter) => {
    setCurrentReciter(reciter);
    if (isPlaying) {
      playSurah(currentSurah, reciter);
    }
  };

  const togglePlayPause = () => {
    if (!quranAudioRef.current) return;
    if (isPlaying) {
      quranAudioRef.current.pause();
    } else {
      if (!quranAudioRef.current.src || quranAudioRef.current.src === '') {
        playSurah(currentSurah, currentReciter);
      } else {
        quranAudioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  const seek = (seconds: number) => {
    if (quranAudioRef.current) {
      quranAudioRef.current.currentTime = seconds;
      const dur = quranAudioRef.current.duration || duration;
      audioProgressService.notify(seconds, dur);
      setCurrentTime(seconds);
    }
  };

  const skipForward = (seconds = 10) => {
    if (quranAudioRef.current) {
      const target = Math.min(quranAudioRef.current.currentTime + seconds, duration);
      seek(target);
    }
  };

  const skipBackward = (seconds = 10) => {
    if (quranAudioRef.current) {
      const target = Math.max(quranAudioRef.current.currentTime - seconds, 0);
      seek(target);
    }
  };

  const nextSurah = () => {
    const currentIndex = SURAHS.findIndex((s) => s.number === currentSurah.number);
    const nextIndex = (currentIndex + 1) % SURAHS.length;
    playSurah(SURAHS[nextIndex], currentReciter);
  };

  const previousSurah = () => {
    const currentIndex = SURAHS.findIndex((s) => s.number === currentSurah.number);
    const prevIndex = (currentIndex - 1 + SURAHS.length) % SURAHS.length;
    playSurah(SURAHS[prevIndex], currentReciter);
  };

  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const toggleRepeat = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  const setQuranVolumeLevel = (vol: number) => {
    setQuranVolume(vol);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (quranAudioRef.current) {
      quranAudioRef.current.volume = !isMuted ? 0 : quranVolume;
    }
  };

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  };

  // Sync with browser MediaSession API for lockscreen and notification media controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSurah) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${currentSurah.number}. ${currentSurah.name} (${currentSurah.arabicName})`,
        artist: currentReciter.name,
        album: 'Al-Quran Al-Kareem',
        artwork: [
          { src: currentReciter.photoUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentReciter.photoUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: currentReciter.photoUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentReciter.photoUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (quranAudioRef.current) {
          quranAudioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (quranAudioRef.current) {
          quranAudioRef.current.pause();
          setIsPlaying(false);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && quranAudioRef.current) {
          seek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        skipForward(details.seekOffset || 10);
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        skipBackward(details.seekOffset || 10);
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousSurah();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextSurah();
      });
    } catch (e) {
      console.warn('MediaSession setup error:', e);
    }
  }, [currentSurah, currentReciter]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (_) {}
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    try {
      if (duration > 0 && quranAudioRef.current) {
        const cur = quranAudioRef.current.currentTime;
        if (cur >= 0 && cur <= duration) {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: playbackSpeed,
            position: cur,
          });
        }
      }
    } catch (_) {}
  }, [duration, playbackSpeed, isPlaying]);

  /**
   * Cache current recitation
   */
  const cacheCurrentRecitation = async (): Promise<boolean> => {
    setIsCachingActive(true);
    setCachingProgress(5);
    setCachingStatusText('Initializing offline storage...');

    const success = await offlineAudioService.cacheRecitation(
      currentSurah,
      currentReciter,
      (percent, text) => {
        setCachingProgress(percent);
        setCachingStatusText(text);
      }
    );

    setIsCachingActive(false);
    if (success) {
      const items = offlineAudioService.getCachedItems();
      setCachedItems(items);
      setTotalCachedMB(offlineAudioService.getTotalCachedSizeMB());
      setIsCurrentTrackCached(true);
      showToast(`✓ "${currentSurah.name}" saved offline!`);
    } else {
      showToast('Could not cache recitation. Check network & storage.');
    }
    return success;
  };

  /**
   * Toggle Offline Mode: switches offline mode on/off
   */
  const toggleOfflineMode = async () => {
    const nextState = !isOfflineModeEnabled;
    offlineAudioService.setOfflineModeActive(nextState);
    setIsOfflineModeEnabled(nextState);

    if (nextState) {
      const isCached = offlineAudioService.isRecitationCached(currentReciter.id, currentSurah.number);
      if (!isCached) {
        showToast('Caching active recitation for offline playback...');
        await cacheCurrentRecitation();
      } else {
        showToast('Offline Mode enabled. Playing from local cache.');
      }
    } else {
      showToast('Offline Mode disabled. Streaming online.');
    }
  };

  /**
   * Delete specific cached item
   */
  const removeRecitationFromOffline = async (reciterId: string, surahNumber: number) => {
    await offlineAudioService.deleteCachedItem(reciterId, surahNumber);
    const items = offlineAudioService.getCachedItems();
    setCachedItems(items);
    setTotalCachedMB(offlineAudioService.getTotalCachedSizeMB());
    if (currentReciter.id === reciterId && currentSurah.number === surahNumber) {
      setIsCurrentTrackCached(false);
    }
    showToast('Recitation removed from offline cache.');
  };

  /**
   * Clear all offline data
   */
  const clearAllOfflineData = async () => {
    await offlineAudioService.clearAllCache();
    setCachedItems([]);
    setTotalCachedMB(0);
    setIsCurrentTrackCached(false);
    showToast('Offline storage cleared.');
  };

  return (
    <AudioContext.Provider
      value={{
        currentSurah,
        currentReciter,
        lastPlayback,
        resumeLastPlayback,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        playbackSpeed,
        repeatMode,
        isMuted,
        quranVolume,
        isOfflineModeEnabled,
        isCurrentTrackCached,
        isCachingActive,
        cachingProgress,
        cachingStatusText,
        cachedItems,
        totalCachedMB,
        isDeviceOnline,
        toastMessage,
        showToast,
        toggleOfflineMode,
        cacheCurrentRecitation,
        removeRecitationFromOffline,
        clearAllOfflineData,
        sleepTimerRemaining,
        favoriteReciterIds,
        isReciterFavorite,
        toggleFavoriteReciter,
        playSurah,
        selectReciter,
        togglePlayPause,
        seek,
        skipForward,
        skipBackward,
        nextSurah,
        previousSurah,
        setSpeed,
        toggleRepeat,
        setQuranVolumeLevel,
        toggleMute,
        setSleepTimer,
        isFullPlayerOpen,
        setIsFullPlayerOpen,
        isQueueOpen,
        setIsQueueOpen,
        profileReciter,
        setProfileReciter,
        todayListeningSeconds,
        todayListeningMinutes,
        dailyGoalMinutes,
        setDailyGoalMinutes,
        streakDays,
        bestStreakDays,
        thisWeekMinutes,
        weeklyDays,
        setTodayListeningSeconds,
        setTodayListeningMinutes,
        setStreakDays,
        setBestStreakDays,
        setWeeklyDays,
        setThisWeekMinutes,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

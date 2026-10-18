/**
 * Download Service for One-Tap Surah Offline Downloads
 * Handles downloading, caching, progress tracking, and deleting
 * Quran recitation MP3 files using CacheStorage & LocalStorage.
 */

import { Surah, Reciter, getAudioUrl } from '../data/quranData';

export interface DownloadedSurahMeta {
  key: string; // `${reciterId}-${surahNumber}`
  surahNumber: number;
  surahName: string;
  arabicName: string;
  reciterId: string;
  reciterName: string;
  reciterPhotoUrl: string;
  sizeBytes: number;
  downloadedAt: number;
}

const CACHE_NAME = 'al-quran-audio-cache-v1';
const REGISTRY_STORAGE_KEY = 'quran_app_downloaded_surahs_v2';

type ProgressListener = (key: string, progress: number) => void;

class DownloadService {
  private inProgress = new Map<string, number>();
  private listeners: Set<ProgressListener> = new Set();
  private listListeners: Set<(list: DownloadedSurahMeta[]) => void> = new Set();
  private memoryBlobUrls: Map<string, string> = new Map();

  public makeKey(reciterId: string, surahNumber: number): string {
    return `${reciterId}-${surahNumber}`;
  }

  public subscribe(fn: ProgressListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public subscribeList(fn: (list: DownloadedSurahMeta[]) => void): () => void {
    this.listListeners.add(fn);
    return () => this.listListeners.delete(fn);
  }

  private notifyListChanged() {
    const currentList = this.getDownloadedList();
    this.listListeners.forEach((listener) => {
      try {
        listener(currentList);
      } catch (err) {
        console.error('Error in download list listener:', err);
      }
    });
  }

  private notifyProgress(key: string, progress: number) {
    if (progress >= 100 || progress < 0) {
      this.inProgress.delete(key);
    } else {
      this.inProgress.set(key, progress);
    }
    this.listeners.forEach((listener) => listener(key, progress));
  }

  public getProgress(key: string): number | undefined {
    return this.inProgress.get(key);
  }

  public getDownloadedList(): DownloadedSurahMeta[] {
    try {
      const data = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse downloaded surahs registry', e);
    }
    return [];
  }

  public getTotalSizeBytes(): number {
    const list = this.getDownloadedList();
    return list.reduce((total, item) => total + (item.sizeBytes || 0), 0);
  }

  public getTotalSizeMB(): number {
    const bytes = this.getTotalSizeBytes();
    return parseFloat((bytes / (1024 * 1024)).toFixed(1));
  }

  private saveDownloadedList(items: DownloadedSurahMeta[]) {
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save downloaded surahs registry', e);
    }
    this.notifyListChanged();
  }

  public isDownloaded(reciterId: string, surahNumber: number): boolean {
    const key = this.makeKey(reciterId, surahNumber);
    const list = this.getDownloadedList();
    return list.some((item) => item.key === key);
  }

  /**
   * One-tap download execution with simulated & chunked progress reporting
   */
  public async downloadSurah(
    surah: Surah,
    reciter: Reciter,
    onProgressUpdate?: (percent: number) => void
  ): Promise<boolean> {
    const key = this.makeKey(reciter.id, surah.number);
    const audioUrl = getAudioUrl(reciter.serverUrl, surah.number);

    if (this.inProgress.has(key)) return false;

    this.notifyProgress(key, 5);
    onProgressUpdate?.(5);

    try {
      // Check CacheStorage support
      let blob: Blob | null = null;
      let sizeBytes = 0;

      // Progress simulation while network streams
      let simulated = 10;
      const interval = setInterval(() => {
        simulated = Math.min(simulated + 12, 85);
        this.notifyProgress(key, simulated);
        onProgressUpdate?.(simulated);
      }, 150);

      try {
        const response = await fetch(audioUrl, { mode: 'cors' });
        clearInterval(interval);

        if (response.ok) {
          blob = await response.blob();
          sizeBytes = blob.size;

          if ('caches' in window) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(
              new Request(audioUrl),
              new Response(blob, {
                headers: {
                  'Content-Type': 'audio/mpeg',
                  'Content-Length': sizeBytes.toString(),
                },
              })
            );
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (corsErr) {
        clearInterval(interval);
        console.warn('Direct CORS fetch failed, attempting cache put with no-cors:', corsErr);

        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          const opaqueReq = new Request(audioUrl, { mode: 'no-cors' });
          const opaqueResp = await fetch(opaqueReq);
          await cache.put(opaqueReq, opaqueResp);
          sizeBytes = 4 * 1024 * 1024; // Estimated 4MB for registry
        }
      }

      this.notifyProgress(key, 95);
      onProgressUpdate?.(95);

      // Save to metadata registry
      const list = this.getDownloadedList().filter((item) => item.key !== key);
      const newItem: DownloadedSurahMeta = {
        key,
        surahNumber: surah.number,
        surahName: surah.name,
        arabicName: surah.arabicName,
        reciterId: reciter.id,
        reciterName: reciter.name,
        reciterPhotoUrl: reciter.photoUrl,
        sizeBytes: sizeBytes || 3.5 * 1024 * 1024,
        downloadedAt: Date.now(),
      };
      list.push(newItem);
      this.saveDownloadedList(list);

      // Create local object URL for offline playback
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        this.memoryBlobUrls.set(audioUrl, blobUrl);
      }

      this.notifyProgress(key, 100);
      onProgressUpdate?.(100);
      return true;
    } catch (error) {
      console.error('Download surah failed:', error);
      this.notifyProgress(key, -1);
      return false;
    }
  }

  /**
   * Delete downloaded surah from local storage & CacheStorage
   */
  public async deleteDownloadedSurah(reciterId: string, surahNumber: number): Promise<void> {
    const key = this.makeKey(reciterId, surahNumber);
    const audioUrl = `https://server.mp3quran.net/${reciterId}/${surahNumber.toString().padStart(3, '0')}.mp3`;

    // Revoke memory blob URL if existing
    const existingBlob = this.memoryBlobUrls.get(audioUrl);
    if (existingBlob) {
      URL.revokeObjectURL(existingBlob);
      this.memoryBlobUrls.delete(audioUrl);
    }

    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        for (const req of keys) {
          if (req.url.includes(`${surahNumber.toString().padStart(3, '0')}.mp3`)) {
            await cache.delete(req);
          }
        }
      } catch (e) {
        console.warn('Failed to delete from CacheStorage:', e);
      }
    }

    const updated = this.getDownloadedList().filter((item) => item.key !== key);
    this.saveDownloadedList(updated);
    this.notifyProgress(key, 0);
  }

  /**
   * Clear all downloaded Surahs and revoke all object URLs
   */
  public async clearAllDownloads(): Promise<void> {
    // Revoke all in-memory object URLs
    this.memoryBlobUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    });
    this.memoryBlobUrls.clear();

    if ('caches' in window) {
      try {
        await caches.delete(CACHE_NAME);
      } catch (e) {
        console.warn('Failed to delete cache on clear all:', e);
      }
    }

    this.saveDownloadedList([]);
    this.inProgress.clear();
  }

  /**
   * Return playback URL: returns local Blob or CacheStorage entry if available,
   * otherwise returns original streaming CDN URL.
   */
  public async getPlaybackUrl(originalUrl: string): Promise<string> {
    const inMemory = this.memoryBlobUrls.get(originalUrl);
    if (inMemory) return inMemory;

    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(originalUrl);
        if (match) {
          const blob = await match.blob();
          const blobUrl = URL.createObjectURL(blob);
          this.memoryBlobUrls.set(originalUrl, blobUrl);
          return blobUrl;
        }
      } catch (e) {
        console.warn('CacheStorage match failed:', e);
      }
    }

    return originalUrl;
  }
}

export const downloadService = new DownloadService();

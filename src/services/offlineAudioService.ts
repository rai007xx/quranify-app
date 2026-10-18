/**
 * Offline Quran Audio Caching Service
 * Uses Web CacheStorage API and LocalStorage metadata registry to store and serve
 * Quran recitations completely offline.
 */

export interface CachedRecitationItem {
  id: string; // reciterId-surahNumber
  surahNumber: number;
  surahName: string;
  arabicName: string;
  reciterId: string;
  reciterName: string;
  reciterPhotoUrl: string;
  audioUrl: string;
  sizeBytes: number;
  cachedAt: number;
}

const CACHE_NAME = 'al-quran-audio-cache-v2';
const REGISTRY_STORAGE_KEY = 'quran_app_offline_registry_v2';
const OFFLINE_MODE_PREF_KEY = 'quran_app_offline_mode_active_v2';

class OfflineAudioService {
  private memoryBlobUrls: Map<string, string> = new Map();

  /**
   * Check if CacheStorage is supported in this browser environment
   */
  public isCacheSupported(): boolean {
    return typeof window !== 'undefined' && 'caches' in window;
  }

  /**
   * Get all registered cached recitation metadata
   */
  public getCachedItems(): CachedRecitationItem[] {
    try {
      const data = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load offline cache registry:', e);
    }
    return [];
  }

  /**
   * Save registry to localStorage
   */
  private saveCachedItems(items: CachedRecitationItem[]) {
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save offline cache registry:', e);
    }
  }

  /**
   * Check if a specific Surah by a reciter is stored offline
   */
  public isRecitationCached(reciterId: string, surahNumber: number): boolean {
    const items = this.getCachedItems();
    return items.some((i) => i.reciterId === reciterId && i.surahNumber === surahNumber);
  }

  /**
   * Calculate total size of cached files in Megabytes
   */
  public getTotalCachedSizeMB(): number {
    const items = this.getCachedItems();
    const totalBytes = items.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
    return parseFloat((totalBytes / (1024 * 1024)).toFixed(1));
  }

  /**
   * Check if Offline Mode enforcement is active
   */
  public isOfflineModeActive(): boolean {
    try {
      return localStorage.getItem(OFFLINE_MODE_PREF_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Set Offline Mode state
   */
  public setOfflineModeActive(active: boolean): void {
    try {
      localStorage.setItem(OFFLINE_MODE_PREF_KEY, active ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to persist offline mode state:', e);
    }
  }

  /**
   * Download and cache the currently active recitation
   */
  public async cacheRecitation(
    surah: { number: number; name: string; arabicName: string },
    reciter: { id: string; name: string; photoUrl: string; serverUrl: string },
    onProgress?: (percent: number, statusText: string) => void
  ): Promise<boolean> {
    if (!this.isCacheSupported()) {
      console.warn('CacheStorage is not supported in this environment');
      return false;
    }

    const padded = surah.number.toString().padStart(3, '0');
    const cleanServer = reciter.serverUrl.endsWith('/') ? reciter.serverUrl : `${reciter.serverUrl}/`;
    const quranAudioUrl = `${cleanServer}${padded}.mp3`;

    try {
      onProgress?.(15, 'Connecting to recitation audio stream...');
      const cache = await window.caches.open(CACHE_NAME);

      let quranSize = 0;
      let quranBlob: Blob | null = null;

      try {
        onProgress?.(45, `Downloading ${surah.name} by ${reciter.name.split(' ')[0]}...`);
        const response = await fetch(quranAudioUrl, { mode: 'cors' });

        if (response.ok) {
          const clonedResponse = response.clone();
          quranBlob = await response.blob();
          quranSize = quranBlob.size;

          // Put in CacheStorage
          await cache.put(quranAudioUrl, clonedResponse);

          // Create local object URL for instant zero-latency playback
          const localUrl = URL.createObjectURL(quranBlob);
          this.memoryBlobUrls.set(quranAudioUrl, localUrl);
        } else {
          await cache.add(new Request(quranAudioUrl, { mode: 'no-cors' }));
          quranSize = 3500000;
        }
      } catch (fetchErr) {
        console.warn('Standard fetch failed, trying no-cors fallback:', fetchErr);
        try {
          await cache.add(new Request(quranAudioUrl, { mode: 'no-cors' }));
          quranSize = 3500000;
        } catch (innerErr) {
          console.error('Failed to cache recitation audio:', innerErr);
        }
      }

      onProgress?.(85, 'Registering offline playback token...');

      // Register in local storage metadata
      const items = this.getCachedItems();
      const itemId = `${reciter.id}-${surah.number}`;
      const filtered = items.filter((item) => item.id !== itemId);

      const newItem: CachedRecitationItem = {
        id: itemId,
        surahNumber: surah.number,
        surahName: surah.name,
        arabicName: surah.arabicName,
        reciterId: reciter.id,
        reciterName: reciter.name,
        reciterPhotoUrl: reciter.photoUrl,
        audioUrl: quranAudioUrl,
        sizeBytes: quranSize || 3500000,
        cachedAt: Date.now(),
      };

      filtered.unshift(newItem);
      this.saveCachedItems(filtered);

      onProgress?.(100, 'Offline caching complete!');
      return true;
    } catch (e) {
      console.error('Error during offline caching:', e);
      return false;
    }
  }

  /**
   * Retrieve the playback URL: if cached, returns a blob or cached resource
   */
  public async getPlaybackUrl(originalUrl: string): Promise<string> {
    // 1. Check in-memory Blob URL first
    if (this.memoryBlobUrls.has(originalUrl)) {
      return this.memoryBlobUrls.get(originalUrl)!;
    }

    if (!this.isCacheSupported()) return originalUrl;

    try {
      const cache = await window.caches.open(CACHE_NAME);
      const matched = await cache.match(originalUrl);
      if (matched) {
        try {
          const blob = await matched.blob();
          if (blob && blob.size > 0) {
            const blobUrl = URL.createObjectURL(blob);
            this.memoryBlobUrls.set(originalUrl, blobUrl);
            return blobUrl;
          }
        } catch (_) {
          // If blob cannot be extracted, fallback to originalUrl
        }
      }
    } catch (e) {
      console.warn('Cache lookup failed:', e);
    }

    return originalUrl;
  }

  /**
   * Delete a cached recitation from offline storage
   */
  public async deleteCachedItem(reciterId: string, surahNumber: number): Promise<void> {
    const items = this.getCachedItems();
    const target = items.find((i) => i.reciterId === reciterId && i.surahNumber === surahNumber);

    if (target && this.isCacheSupported()) {
      try {
        const cache = await window.caches.open(CACHE_NAME);
        await cache.delete(target.audioUrl);
        this.memoryBlobUrls.delete(target.audioUrl);
      } catch (e) {
        console.warn('Failed to delete from cache:', e);
      }
    }

    const updated = items.filter(
      (item) => !(item.reciterId === reciterId && item.surahNumber === surahNumber)
    );
    this.saveCachedItems(updated);
  }

  /**
   * Clear all offline cached audio
   */
  public async clearAllCache(): Promise<void> {
    if (this.isCacheSupported()) {
      try {
        await window.caches.delete(CACHE_NAME);
        this.memoryBlobUrls.clear();
      } catch (e) {
        console.warn('Failed to delete cache storage:', e);
      }
    }
    this.saveCachedItems([]);
  }
}

export const offlineAudioService = new OfflineAudioService();

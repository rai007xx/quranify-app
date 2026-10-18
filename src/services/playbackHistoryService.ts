export interface PlaybackHistory {
  surahNumber: number;
  surahName: string;
  arabicName: string;
  reciterId: string;
  reciterName: string;
  reciterPhoto: string;
  positionSeconds: number;
  totalDurationSeconds: number;
  updatedAt: string;
}

const STORAGE_KEY = 'quran_last_playback_state_v1';

class PlaybackHistoryService {
  private listeners = new Set<(history: PlaybackHistory | null) => void>();
  private currentHistory: PlaybackHistory | null = null;

  constructor() {
    this.currentHistory = this.load();
  }

  public load(): PlaybackHistory | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public getHistory(): PlaybackHistory | null {
    return this.currentHistory;
  }

  public hasHistory(): boolean {
    return this.currentHistory !== null && this.currentHistory.positionSeconds > 0;
  }

  public save(data: {
    surahNumber: number;
    surahName: string;
    arabicName: string;
    reciterId: string;
    reciterName: string;
    reciterPhoto: string;
    positionSeconds: number;
    totalDurationSeconds: number;
  }): void {
    if (data.positionSeconds < 0) return;

    const item: PlaybackHistory = {
      ...data,
      positionSeconds: Math.floor(data.positionSeconds),
      totalDurationSeconds: Math.floor(data.totalDurationSeconds),
      updatedAt: new Date().toISOString(),
    };

    this.currentHistory = item;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
    } catch (e) {
      console.warn('Could not save playback history:', e);
    }

    this.notify();
  }

  public clear(): void {
    this.currentHistory = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    this.notify();
  }

  public subscribe(callback: (history: PlaybackHistory | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentHistory);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentHistory);
    }
  }

  public formatSeconds(sec: number): string {
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  }
}

export const playbackHistoryService = new PlaybackHistoryService();

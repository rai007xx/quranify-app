/**
 * Real-Time Quran Listening Habit & Goal Tracker Service
 * Tracks second-by-second listening duration, maintains daily historical archives,
 * computes weekly totals, and manages streak persistence starting from ZERO (0 Days).
 */

export interface DailyListeningRecord {
  dateKey: string; // YYYY-MM-DD
  seconds: number;
  goalMet: boolean;
}

export interface WeeklyDayStatus {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dateKey: string;
  minutes: number;
  completed: boolean;
  isToday: boolean;
}

// Storage keys versioned to ensure clean zero-state for fresh users
const STORAGE_KEY_RECORDS = 'quran_listening_records_v2';
const STORAGE_KEY_GOAL = 'quran_listening_goal_v2';
const STORAGE_KEY_STREAK = 'quran_listening_streak_v2';
const STORAGE_KEY_BEST_RECORD = 'quran_listening_best_streak_v2';

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
  const day = yesterday.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class ListeningInsightsService {
  /**
   * Load all daily records - Starts completely empty (0 records) for a fresh user
   */
  public getRecords(): Record<string, number> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse listening records:', e);
    }
    // Starts at ZERO for a fresh user - NO mock / dummy seeded minutes
    return {};
  }

  public saveRecords(records: Record<string, number>) {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save listening records:', e);
    }
  }

  /**
   * Add active listening seconds to today's tally
   * Real-time increment while audio is actively playing
   */
  public addListeningSeconds(seconds: number): number {
    const today = getTodayDateKey();
    const records = this.getRecords();
    const current = records[today] || 0;
    const updated = current + seconds;
    records[today] = updated;
    this.saveRecords(records);
    this.updateStreak(updated);
    return Math.floor(updated / 60);
  }

  /**
   * Get today's total listening minutes - Starts at 0 Min
   */
  public getTodayListeningMinutes(): number {
    const today = getTodayDateKey();
    const records = this.getRecords();
    const sec = records[today] || 0;
    return Math.floor(sec / 60);
  }

  /**
   * Get today's total listening seconds
   */
  public getTodayListeningSeconds(): number {
    const today = getTodayDateKey();
    const records = this.getRecords();
    return records[today] || 0;
  }

  /**
   * Daily Goal Target (15, 30, 45, or 60 mins)
   */
  public getDailyGoalMinutes(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEY_GOAL);
      if (val) return parseInt(val, 10);
    } catch {}
    return 30; // default 30 mins
  }

  public setDailyGoalMinutes(minutes: number) {
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, minutes.toString());
    } catch {}
  }

  /**
   * Current Streak: starts at 0 Days for a new user.
   * Changes to 1 Day only after completing at least 1 minute (60 seconds) of listening today.
   */
  public getStreakDays(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STREAK);
      if (saved !== null) {
        return Math.max(parseInt(saved, 10), 0);
      }
    } catch {}
    return 0; // Fresh user starts at 0 Days
  }

  /**
   * Best Record: starts at 0 Days for a new user.
   */
  public getBestStreakDays(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BEST_RECORD);
      if (saved !== null) {
        return Math.max(parseInt(saved, 10), 0);
      }
    } catch {}
    return 0; // Fresh user starts at 0 Days
  }

  /**
   * Update streak logic:
   * Changes to 1 Day only after completing at least 1 minute (60 seconds) of listening today.
   */
  private updateStreak(todaySecs: number) {
    const currentStreak = this.getStreakDays();
    const bestStreak = this.getBestStreakDays();

    // At least 60 seconds (1 minute) of listening today required to trigger Day 1
    if (todaySecs >= 60) {
      let newStreak = currentStreak;
      if (currentStreak === 0) {
        // Check if yesterday had listening to maintain consecutive streak
        const records = this.getRecords();
        const yesterdayKey = getYesterdayDateKey();
        const yesterdaySecs = records[yesterdayKey] || 0;
        newStreak = yesterdaySecs >= 60 ? 2 : 1;
      }

      localStorage.setItem(STORAGE_KEY_STREAK, newStreak.toString());

      if (newStreak > bestStreak) {
        localStorage.setItem(STORAGE_KEY_BEST_RECORD, newStreak.toString());
      }
    }
  }

  /**
   * Calculate Mon - Sun weekly status
   * All circles start UNCHECKED (empty) with 0 minutes for fresh user.
   * A circle is marked completed ONLY when daily listening goal is achieved.
   */
  public getWeeklyDaysStatus(dailyGoalMins: number): WeeklyDayStatus[] {
    const records = this.getRecords();
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const todayKey = getTodayDateKey();

    const dayLabels: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];

    return dayLabels.map((label, index) => {
      // Calculate date key for this day of current week
      const diffDays = index - dayOfWeek;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + diffDays);
      const targetKey = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${targetDate.getDate().toString().padStart(2, '0')}`;

      const isToday = targetKey === todayKey;
      const minutes = Math.floor((records[targetKey] || 0) / 60);

      // Completed ONLY when today's goal is met and minutes > 0 (NO hardcoded dummy completions)
      const completed = minutes >= dailyGoalMins && minutes > 0;

      return {
        day: label,
        dateKey: targetKey,
        minutes,
        completed,
        isToday,
      };
    });
  }

  /**
   * Get total active minutes listened this week
   * Starts at 0 Min for a fresh user
   */
  public getThisWeekTotalMinutes(dailyGoalMins: number): number {
    const week = this.getWeeklyDaysStatus(dailyGoalMins);
    return week.reduce((acc, curr) => acc + curr.minutes, 0);
  }

  /**
   * Reset all listening stats back to absolute zero (useful for testing & resetting)
   */
  public resetToZero() {
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_STREAK);
      localStorage.removeItem(STORAGE_KEY_BEST_RECORD);
    } catch {}
  }
}

export const listeningInsightsService = new ListeningInsightsService();

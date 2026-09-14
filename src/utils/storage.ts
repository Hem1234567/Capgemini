import type { GameAttempt, GameId, GameProgress, ProgressStore } from '../types';

const KEY = 'cgh-progress';

const DEFAULT_STORE: ProgressStore = {
  attempts: [],
  gameProgress: {} as Record<GameId, GameProgress>,
  totalAttempts: 0,
  totalCompleted: 0,
};

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STORE };
    return JSON.parse(raw) as ProgressStore;
  } catch {
    return { ...DEFAULT_STORE };
  }
}

export function saveProgress(store: ProgressStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {}
}

export function addAttempt(attempt: GameAttempt): ProgressStore {
  const store = loadProgress();

  // Limit to last 200 attempts
  const attempts = [attempt, ...store.attempts].slice(0, 200);

  // Update per-game progress
  const existing = store.gameProgress[attempt.gameId];
  const allForGame = attempts.filter(a => a.gameId === attempt.gameId);
  const avgScore = allForGame.reduce((s, a) => s + a.score, 0) / allForGame.length;
  const avgAccuracy = allForGame.reduce((s, a) => s + a.accuracy, 0) / allForGame.length;
  const avgTime = allForGame.reduce((s, a) => s + a.timeTaken, 0) / allForGame.length;
  const bestScore = Math.max(...allForGame.map(a => a.score));

  const DIFF_ORDER = ['beginner', 'easy', 'medium', 'hard', 'expert'];
  const highestDiff = existing
    ? DIFF_ORDER[Math.max(
        DIFF_ORDER.indexOf(existing.highestDifficulty),
        DIFF_ORDER.indexOf(attempt.difficulty)
      )]
    : attempt.difficulty;

  const gameProgress: GameProgress = {
    gameId: attempt.gameId,
    attempts: allForGame.length,
    bestScore,
    avgScore: Math.round(avgScore),
    avgAccuracy: Math.round(avgAccuracy),
    avgTime: Math.round(avgTime),
    currentDifficulty: attempt.difficulty,
    highestDifficulty: highestDiff as GameProgress['highestDifficulty'],
    lastAttempt: attempt.timestamp,
  };

  const updated: ProgressStore = {
    attempts,
    gameProgress: { ...store.gameProgress, [attempt.gameId]: gameProgress },
    totalAttempts: attempts.length,
    totalCompleted: attempts.filter(a => a.correct > 0).length,
  };

  saveProgress(updated);
  return updated;
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function generateAttemptId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

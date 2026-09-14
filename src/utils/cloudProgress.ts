import { supabase } from '../lib/supabaseClient';
import type { Difficulty, GameAttempt, GameId, GameProgress, ProgressStore } from '../types';

const DIFF_ORDER: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

const EMPTY_STORE: ProgressStore = {
  attempts: [],
  gameProgress: {} as ProgressStore['gameProgress'],
  totalAttempts: 0,
  totalCompleted: 0,
};

interface AttemptRow {
  client_id: string | null;
  game_id: string;
  game_name: string;
  difficulty: string;
  mode: string;
  score: number;
  accuracy: number;
  time_taken: number;
  correct: number;
  incorrect: number;
  total: number;
  efficiency: number | null;
  created_at: string;
}

interface ProgressRow {
  game_id: string;
  attempts: number;
  best_score: number;
  avg_score: number;
  avg_accuracy: number;
  avg_time: number;
  current_difficulty: string;
  highest_difficulty: string;
  last_attempt: string;
}

function rowToAttempt(row: AttemptRow): GameAttempt {
  return {
    id: row.client_id ?? crypto.randomUUID(),
    gameId: row.game_id as GameId,
    gameName: row.game_name,
    difficulty: row.difficulty as Difficulty,
    mode: row.mode as GameAttempt['mode'],
    score: row.score,
    accuracy: row.accuracy,
    timeTaken: row.time_taken,
    correct: row.correct,
    incorrect: row.incorrect,
    total: row.total,
    efficiency: row.efficiency ?? undefined,
    timestamp: new Date(row.created_at).getTime(),
  };
}

function rowToProgress(row: ProgressRow): GameProgress {
  return {
    gameId: row.game_id as GameId,
    attempts: row.attempts,
    bestScore: row.best_score,
    avgScore: row.avg_score,
    avgAccuracy: row.avg_accuracy,
    avgTime: row.avg_time,
    currentDifficulty: row.current_difficulty as Difficulty,
    highestDifficulty: row.highest_difficulty as Difficulty,
    lastAttempt: new Date(row.last_attempt).getTime(),
  };
}

/** Load everything Supabase knows about this user's progress. */
export async function fetchCloudProgress(userId: string): Promise<ProgressStore> {
  if (!supabase) return { ...EMPTY_STORE };

  const [{ data: attemptRows, error: attemptsErr }, { data: progressRows, error: progressErr }] =
    await Promise.all([
      supabase
        .from('game_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('game_progress').select('*').eq('user_id', userId),
    ]);

  if (attemptsErr || progressErr) {
    console.error('[Supabase] Failed to load progress:', attemptsErr ?? progressErr);
    return { ...EMPTY_STORE };
  }

  const attempts = (attemptRows ?? []).map(rowToAttempt);
  const gameProgress = {} as ProgressStore['gameProgress'];
  for (const row of (progressRows ?? []) as ProgressRow[]) {
    gameProgress[row.game_id as GameId] = rowToProgress(row);
  }

  return {
    attempts,
    gameProgress,
    totalAttempts: attempts.length,
    totalCompleted: attempts.filter(a => a.correct > 0).length,
  };
}

/** Record a new attempt in Supabase, then recompute + upsert that game's rollup row. */
export async function saveCloudAttempt(
  userId: string,
  attempt: GameAttempt,
  currentStore: ProgressStore
): Promise<ProgressStore> {
  if (!supabase) return currentStore;

  const { error: insertErr } = await supabase.from('game_attempts').insert({
    user_id: userId,
    client_id: attempt.id,
    game_id: attempt.gameId,
    game_name: attempt.gameName,
    difficulty: attempt.difficulty,
    mode: attempt.mode,
    score: attempt.score,
    accuracy: attempt.accuracy,
    time_taken: attempt.timeTaken,
    correct: attempt.correct,
    incorrect: attempt.incorrect,
    total: attempt.total,
    efficiency: attempt.efficiency ?? null,
    created_at: new Date(attempt.timestamp).toISOString(),
  });

  if (insertErr) {
    console.error('[Supabase] Failed to save attempt:', insertErr);
    return currentStore;
  }

  const attempts = [attempt, ...currentStore.attempts].slice(0, 200);
  const allForGame = attempts.filter(a => a.gameId === attempt.gameId);
  const avgScore = allForGame.reduce((s, a) => s + a.score, 0) / allForGame.length;
  const avgAccuracy = allForGame.reduce((s, a) => s + a.accuracy, 0) / allForGame.length;
  const avgTime = allForGame.reduce((s, a) => s + a.timeTaken, 0) / allForGame.length;
  const bestScore = Math.max(...allForGame.map(a => a.score));

  const existing = currentStore.gameProgress[attempt.gameId];
  const highestDiff = existing
    ? DIFF_ORDER[Math.max(DIFF_ORDER.indexOf(existing.highestDifficulty), DIFF_ORDER.indexOf(attempt.difficulty))]
    : attempt.difficulty;

  const progress: GameProgress = {
    gameId: attempt.gameId,
    attempts: allForGame.length,
    bestScore,
    avgScore: Math.round(avgScore),
    avgAccuracy: Math.round(avgAccuracy),
    avgTime: Math.round(avgTime),
    currentDifficulty: attempt.difficulty,
    highestDifficulty: highestDiff,
    lastAttempt: attempt.timestamp,
  };

  const { error: upsertErr } = await supabase.from('game_progress').upsert(
    {
      user_id: userId,
      game_id: progress.gameId,
      attempts: progress.attempts,
      best_score: progress.bestScore,
      avg_score: progress.avgScore,
      avg_accuracy: progress.avgAccuracy,
      avg_time: progress.avgTime,
      current_difficulty: progress.currentDifficulty,
      highest_difficulty: progress.highestDifficulty,
      last_attempt: new Date(progress.lastAttempt).toISOString(),
    },
    { onConflict: 'user_id,game_id' }
  );

  if (upsertErr) console.error('[Supabase] Failed to update progress rollup:', upsertErr);

  return {
    attempts,
    gameProgress: { ...currentStore.gameProgress, [attempt.gameId]: progress },
    totalAttempts: attempts.length,
    totalCompleted: attempts.filter(a => a.correct > 0).length,
  };
}

/** Wipe all cloud progress for this user (used by the "Reset Progress" button). */
export async function resetCloudProgress(userId: string): Promise<void> {
  if (!supabase) return;
  await Promise.all([
    supabase.from('game_attempts').delete().eq('user_id', userId),
    supabase.from('game_progress').delete().eq('user_id', userId),
  ]);
}

/**
 * One-time migration: if this account has no cloud attempts yet but the
 * browser has local ones (from playing before signing in), push them up so
 * nothing is lost when switching to cloud sync.
 */
export async function migrateLocalToCloud(userId: string, local: ProgressStore): Promise<ProgressStore> {
  if (!supabase || local.attempts.length === 0) return await fetchCloudProgress(userId);

  const cloud = await fetchCloudProgress(userId);
  if (cloud.attempts.length > 0) return cloud; // already has cloud data — don't clobber it

  // Replay local attempts oldest-first so rollups (best score, averages, etc.) build up correctly.
  const oldestFirst = [...local.attempts].sort((a, b) => a.timestamp - b.timestamp);
  let store: ProgressStore = { ...EMPTY_STORE };
  for (const attempt of oldestFirst) {
    store = await saveCloudAttempt(userId, attempt, store);
  }
  return store;
}

import type { ScoreResult, Difficulty } from '../types';

const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export function getNextDifficulty(current: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
}

export function getPrevDifficulty(current: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
}

export function calculateScore(
  correct: number,
  total: number,
  timeTaken: number,
  timeLimit: number,
  efficiency = 1
): number {
  if (total === 0) return 0;
  const accuracy = correct / total;
  const timeBonus = Math.max(0, 1 - timeTaken / (timeLimit * 1.2));
  const raw = accuracy * 70 + timeBonus * 20 + efficiency * 10;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getPerformanceRating(
  score: number,
  currentDifficulty: Difficulty,
  accuracy: number
): ScoreResult {
  let performance: ScoreResult['performance'];
  let label: string;
  let message: string;
  let recommendedDifficulty: Difficulty;

  if (score >= 90) {
    performance = 'excellent';
    label = 'Excellent';
    message = 'Excellent speed and accuracy. You are ready to level up!';
    recommendedDifficulty = getNextDifficulty(currentDifficulty);
  } else if (score >= 75) {
    performance = 'strong';
    label = 'Strong';
    message = 'Strong performance. Continue improving your speed.';
    recommendedDifficulty = accuracy >= 85 ? getNextDifficulty(currentDifficulty) : currentDifficulty;
  } else if (score >= 60) {
    performance = 'good';
    label = 'Good';
    message = 'Good foundation. Focus on improving accuracy.';
    recommendedDifficulty = currentDifficulty;
  } else if (score >= 40) {
    performance = 'needs-practice';
    label = 'Needs Practice';
    message = 'Practice the game mechanics and try again.';
    recommendedDifficulty = getPrevDifficulty(currentDifficulty);
  } else {
    performance = 'beginner';
    label = 'Beginner';
    message = 'Start with Beginner or Easy mode and learn the mechanics.';
    recommendedDifficulty = 'beginner';
  }

  return {
    score,
    accuracy,
    performance,
    label,
    message,
    recommendedDifficulty,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

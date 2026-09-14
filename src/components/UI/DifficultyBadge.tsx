import type { Difficulty } from '../../types';

const DIFF_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="badge" style={{
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--text-primary)'
    }}>
      {DIFF_LABELS[difficulty]}
    </span>
  );
}

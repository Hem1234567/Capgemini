import { Link } from 'react-router-dom';
import { Trophy, Target, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import type { ScoreResult } from '../../types';
import { formatTime } from '../../utils/scoring';

interface ScoreResultCardProps {
  result: ScoreResult;
  correct: number;
  incorrect: number;
  total: number;
  timeTaken: number;
  moves?: number;
  optimalMoves?: number;
  onPlayAgain?: () => void;
  gameId?: string;
}

const PERF_COLORS: Record<ScoreResult['performance'], string> = {
  excellent: 'var(--text-primary)',
  strong: 'var(--text-primary)',
  good: 'var(--text-primary)',
  'needs-practice': 'var(--accent)',
  beginner: 'var(--accent)',
};

export default function ScoreResultCard({
  result, correct, incorrect, total, timeTaken, moves, optimalMoves, onPlayAgain, gameId: _gameId
}: ScoreResultCardProps) {
  const color = PERF_COLORS[result.performance];

  return (
    <div className="animate-scale-in" style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Score Box */}
      <div className="card newsprint-texture" style={{ padding: '2.5rem', textAlign: 'center', border: '2px solid var(--border)' }}>
        <div style={{
          width: 120, height: 120, border: `4px solid ${color}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          background: 'var(--bg)',
        }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 900, color, lineHeight: 1 }}>{result.score}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>Score</span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: `2px solid ${color}`, color, padding: '0.5rem 1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', background: 'var(--bg)' }}>
          <Trophy size={16} />
          {result.label}
        </div>

        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontStyle: 'italic' }}>{result.message}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <StatItem icon={<Target size={16} />} label="Accuracy" value={`${result.accuracy}%`} />
        <StatItem icon={<Clock size={16} />} label="Time Taken" value={formatTime(timeTaken)} />
        <StatItem icon={<CheckCircle size={16} />} label="Correct" value={`${correct}/${total}`} color="var(--text-primary)" />
        <StatItem icon={<XCircle size={16} />} label="Incorrect" value={incorrect.toString()} color={incorrect > 0 ? 'var(--accent)' : undefined} />
        {moves !== undefined && optimalMoves !== undefined && (
          <StatItem icon={<TrendingUp size={16} />} label="Efficiency" value={`${Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100)}%`} />
        )}
      </div>

      {/* Recommended difficulty */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: 'var(--text-primary)', color: 'var(--bg)', border: 'none' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recommended next difficulty:{' '}
          <strong style={{ color: 'var(--bg)', borderBottom: '1px solid var(--bg)' }}>{result.recommendedDifficulty}</strong>
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {onPlayAgain && (
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onPlayAgain}>
            Play Again
          </button>
        )}
        <Link to="/games" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>
          Try Another Game
        </Link>
        <Link to="/progress" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>
          View Progress
        </Link>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '2px solid var(--border)' }}>
      <span style={{ color: color ?? 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', padding: '0.5rem', background: 'var(--bg)' }}>{icon}</span>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: color ?? 'var(--text-primary)', fontSize: '1.25rem', marginTop: '0.25rem' }}>{value}</div>
      </div>
    </div>
  );
}

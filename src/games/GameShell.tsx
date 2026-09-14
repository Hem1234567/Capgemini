import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getGame } from '../data/games';
import type { Difficulty, PracticeMode, GameId } from '../types';
import { useProgress } from '../context/ProgressContext';
import NoticeBanner from '../components/UI/NoticeBanner';

// Lazy-loaded game components
import MotionChallenge from './motion/MotionChallenge';
import GridChallenge from './grid/GridChallenge';
import SwitchChallenge from './switch/SwitchChallenge';
import DigitChallenge from './digit/DigitChallenge';
import GeoSudo from './geosudo/GeoSudo';
import InductiveChallenge from './inductive/InductiveChallenge';
import ColorTheGrid from './colorgrid/ColorTheGrid';
import SameRuleChallenge from './samerule/SameRuleChallenge';

const GAME_COMPONENTS: Record<GameId, React.ComponentType<GameComponentProps>> = {
  'motion-challenge': MotionChallenge,
  'grid-challenge': GridChallenge,
  'switch-challenge': SwitchChallenge,
  'digit-challenge': DigitChallenge,
  'geo-sudo': GeoSudo,
  'inductive-challenge': InductiveChallenge,
  'color-the-grid': ColorTheGrid,
  'same-rule-challenge': SameRuleChallenge,
};

export interface GameComponentProps {
  difficulty: Difficulty;
  mode: PracticeMode;
  questionCount: number;
  timeLimit: number; // seconds per session, 0 = no limit
  onComplete: (result: GameResult) => void;
  onExit: () => void;
}

export interface GameResult {
  score: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  total: number;
  timeTaken: number;
  efficiency?: number;
  moves?: number;
  optimalMoves?: number;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

const MODE_CONFIG: Record<PracticeMode, { questions: number; hasTimer: boolean; timeLimitSeconds: number }> = {
  quick: { questions: 5, hasTimer: false, timeLimitSeconds: 0 },
  standard: { questions: 10, hasTimer: true, timeLimitSeconds: 600 },
  timed: { questions: 15, hasTimer: true, timeLimitSeconds: 360 },
  mock: { questions: 10, hasTimer: true, timeLimitSeconds: 360 },
};

type Phase = 'pre' | 'playing' | 'done';

export default function GameShell() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveAttempt, getGameProgress } = useProgress();

  const game = getGame(gameId ?? '');
  const [phase, setPhase] = useState<Phase>('pre');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<PracticeMode>(() => {
    const m = searchParams.get('mode');
    if (m === 'quick' || m === 'standard' || m === 'timed' || m === 'mock') return m;
    return 'standard';
  });
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [gameKey, setGameKey] = useState(0); // to remount game on restart

  useEffect(() => {
    if (game) {
      const gp = getGameProgress(game.id as GameId);
      if (gp) setDifficulty(gp.currentDifficulty);
    }
  }, [game, getGameProgress]);

  if (!game) {
    return (
      <div className="container-page" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Game Not Found</h1>
        <Link to="/games" className="btn-primary">Back to All Games</Link>
      </div>
    );
  }

  const GameComp = GAME_COMPONENTS[game.id as GameId];
  const modeConfig = MODE_CONFIG[mode];

  const handleComplete = (result: GameResult) => {
    setLastResult(result);
    setPhase('done');
    saveAttempt({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      gameId: game.id as GameId,
      gameName: game.name,
      difficulty,
      mode,
      score: result.score,
      accuracy: result.accuracy,
      timeTaken: result.timeTaken,
      correct: result.correct,
      incorrect: result.incorrect,
      total: result.total,
      efficiency: result.efficiency,
      timestamp: Date.now(),
    });
  };

  const handleExit = () => navigate('/games');
  const handlePlayAgain = () => {
    setLastResult(null);
    setPhase('pre');
    setGameKey(k => k + 1);
  };

  // ── Pre-game screen ────────────────────────────────────────────────────────
  if (phase === 'pre') {
    return (
      <div className="bg-page" style={{ paddingBottom: '3rem' }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 0' }}>
          <div className="container-page" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/games" className="btn-ghost"><ArrowLeft size={18} /></Link>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>All Games /</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{game.name}</span>
          </div>
        </div>

        <div className="container-page" style={{ paddingTop: '2rem', maxWidth: 720 }}>
          {/* Game title */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div className="badge" style={{ marginBottom: '0.625rem' }}>{game.categoryTag}</div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{game.name}</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>{game.description}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>Skill tested: {game.skill} · Suggested time: {game.suggestedTime}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {/* Difficulty selector */}
            <div className="card" style={{ padding: '1.125rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {(['beginner', 'easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={difficulty === d ? 'filter-chip active' : 'filter-chip'}
                    style={{ fontSize: '0.75rem', textTransform: 'capitalize', padding: '0.25rem 0.625rem' }}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode selector */}
            <div className="card" style={{ padding: '1.125rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Practice Mode</label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {(['quick', 'standard', 'timed'] as PracticeMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={mode === m ? 'filter-chip active' : 'filter-chip'}
                    style={{ fontSize: '0.75rem', textTransform: 'capitalize', padding: '0.25rem 0.625rem' }}
                  >
                    {m === 'quick' ? 'Quick (5Q)' : m === 'standard' ? 'Standard (10Q)' : 'Timed'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notice */}
          <div style={{ marginBottom: '1.5rem' }}>
            <NoticeBanner compact />
          </div>

          {/* Quick reference */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.375rem' }}>🎯 Objective</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {game.id === 'motion-challenge' && 'Move the player object from its starting position to the target using efficient, planned moves.'}
              {game.id === 'grid-challenge' && 'Memorize highlighted grid positions, complete a distraction task, then recall the correct cells.'}
              {game.id === 'switch-challenge' && 'Observe how a visual arrangement transforms and identify the transformation rule.'}
              {game.id === 'digit-challenge' && 'Reach the target number using the available digits and permitted mathematical operations.'}
              {game.id === 'geo-sudo' && 'Fill the grid so every row and column contains each symbol exactly once.'}
              {game.id === 'inductive-challenge' && 'Identify the hidden rule from examples and select the answer that follows the same rule.'}
              {game.id === 'color-the-grid' && 'Select all grid cells that satisfy the given rule before the timer expires.'}
              {game.id === 'same-rule-challenge' && 'Identify the transformation rule from an example and select the option following the same rule.'}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '1rem', padding: '0.875rem 1.5rem', minWidth: 160 }}
              onClick={() => setPhase('playing')}
            >
              Start Practice
            </button>
            <Link to={`/how-to-play/${game.id}`} className="btn-secondary" style={{ padding: '0.875rem 1.25rem' }}>
              <BookOpen size={16} /> How to Play
            </Link>
            <Link to="/games" className="btn-secondary" style={{ padding: '0.875rem 1.25rem' }}>
              <ArrowLeft size={16} /> Back to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing screen ─────────────────────────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div className="bg-game" style={{ minHeight: 'calc(100dvh - 60px)' }}>
        <GameComp
          key={gameKey}
          difficulty={difficulty}
          mode={mode}
          questionCount={modeConfig.questions}
          timeLimit={modeConfig.timeLimitSeconds}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 0', marginBottom: '2rem' }}>
        <div className="container-page">
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.125rem' }}>Game Complete — {game.name}</h2>
        </div>
      </div>
      <div className="container-page" style={{ maxWidth: 600 }}>
        {lastResult && (
          <ResultDisplay result={lastResult} onPlayAgain={handlePlayAgain} gameId={game.id} />
        )}
      </div>
    </div>
  );
}

function ResultDisplay({ result, onPlayAgain }: { result: GameResult; onPlayAgain: () => void; gameId?: string }) {
  const { getPerformanceRating } = useGamePerformance(result);
  const rating = getPerformanceRating();

  const PERF_COLORS: Record<string, string> = {
    excellent: 'var(--green)', strong: 'var(--accent)', good: 'var(--yellow)',
    'needs-practice': '#F97316', beginner: 'var(--red)',
  };
  const color = PERF_COLORS[rating.performance] ?? 'var(--accent)';

  return (
    <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Score box */}
      <div className="card newsprint-texture" style={{ padding: '2rem', textAlign: 'center', border: '2px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ width: 100, height: 100, border: `6px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', background: 'var(--bg)' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic', color, lineHeight: 1 }}>{result.score}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>Score</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: `2px solid ${color}`, background: color + '18', color, padding: '0.375rem 0.875rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          {rating.label}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{rating.message}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {[
          { label: 'Accuracy', value: `${result.accuracy}%` },
          { label: 'Time', value: formatTimeSec(result.timeTaken) },
          { label: 'Correct', value: `${result.correct}/${result.total}` },
          { label: 'Incorrect', value: result.incorrect },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="card" style={{ padding: '0.875rem 1rem', background: 'var(--accent-light)' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          📈 Recommended next difficulty: <strong style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{rating.recommendedDifficulty}</strong>
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 130 }} onClick={onPlayAgain}>
          Play Again
        </button>
        <Link to="/games" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', minWidth: 130 }}>
          All Games
        </Link>
        <Link to="/progress" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', minWidth: 130 }}>
          My Progress
        </Link>
      </div>
    </div>
  );
}

function useGamePerformance(result: GameResult) {
  const getPerformanceRating = () => {
    const score = result.score;
    if (score >= 90) return { performance: 'excellent', label: '🏆 Excellent', message: 'Excellent speed and accuracy!', recommendedDifficulty: 'hard' as Difficulty };
    if (score >= 75) return { performance: 'strong', label: '⭐ Strong', message: 'Strong performance. Improve your speed.', recommendedDifficulty: 'medium' as Difficulty };
    if (score >= 60) return { performance: 'good', label: '👍 Good', message: 'Good foundation. Focus on accuracy.', recommendedDifficulty: 'medium' as Difficulty };
    if (score >= 40) return { performance: 'needs-practice', label: '📚 Needs Practice', message: 'Practice the mechanics and try again.', recommendedDifficulty: 'easy' as Difficulty };
    return { performance: 'beginner', label: '🌱 Beginner', message: 'Start with Beginner mode to learn.', recommendedDifficulty: 'beginner' as Difficulty };
  };
  return { getPerformanceRating };
}

function formatTimeSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

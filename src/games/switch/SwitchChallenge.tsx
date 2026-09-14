import { useState, useCallback } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { SwitchQuestion, SwitchShape } from '../../types';
import { generateSwitchQuestion } from './switchEngine';
import { formatTime } from '../../utils/scoring';
import { useTimer } from '../../utils/timer';
import { LogOut, CheckCircle, XCircle } from 'lucide-react';

// SVG shape renderer for a 3×3 grid
function ShapeGrid({ shapes, size = 90, selected = false, correct = false, wrong = false }: {
  shapes: SwitchShape[];
  size?: number;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
}) {
  const cellSize = size / 3;
  const borderColor = correct ? 'var(--green)' : wrong ? 'var(--red)' : selected ? 'var(--accent)' : 'var(--border)';

  const renderShape = (shape: SwitchShape, x: number, y: number, cs: number) => {
    const cx = x + cs / 2, cy = y + cs / 2;
    const r = cs * 0.3;
    const { color } = shape;
    switch (shape.shape) {
      case 'circle': return <circle cx={cx} cy={cy} r={r} fill={color} />;
      case 'square': return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={color} />;
      case 'triangle': return <polygon points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`} fill={color} />;
      case 'star': return (
        <polygon points={starPoints(cx, cy, r, r * 0.4, 5).join(' ')} fill={color} />
      );
      case 'diamond': return <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} fill={color} />;
      default: return null;
    }
  };

  return (
    <svg
      width={size} height={size}
      style={{ border: `2px solid ${borderColor}`, background: 'var(--bg-input)', flexShrink: 0, transition: 'all 0.15s' }}
    >
      {/* Grid lines */}
      {[1, 2].map(i => (
        <line key={`h${i}`} x1={0} y1={i * cellSize} x2={size} y2={i * cellSize} stroke="var(--border)" strokeWidth={0.5} />
      ))}
      {[1, 2].map(i => (
        <line key={`v${i}`} x1={i * cellSize} y1={0} x2={i * cellSize} y2={size} stroke="var(--border)" strokeWidth={0.5} />
      ))}
      {shapes.map(shape => {
        const row = Math.floor(shape.position / 3);
        const col = shape.position % 3;
        return (
          <g key={shape.position}>
            {renderShape(shape, col * cellSize, row * cellSize, cellSize)}
          </g>
        );
      })}
    </svg>
  );
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    result.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return result;
}

export default function SwitchChallenge({ difficulty, mode, questionCount, timeLimit, onComplete, onExit }: GameComponentProps) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<SwitchQuestion>(() => generateSwitchQuestion(difficulty, '0'));
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime] = useState(Date.now());

  const QUESTION_TIME = mode === 'quick' ? 0 : Math.ceil(timeLimit / questionCount);

  const nextQuestion = useCallback((wasCorrect: boolean) => {
    const next = qIndex + 1;
    if (next >= questionCount) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const total = questionCount;
      const c = wasCorrect ? correct + 1 : correct;
      const inc = !wasCorrect ? incorrect + 1 : incorrect;
      const acc = Math.round((c / total) * 100);
      const tBonus = timeLimit > 0 ? Math.max(0, 20 - Math.floor(timeTaken / 20)) : 15;
      onComplete({ score: Math.min(100, acc + tBonus), accuracy: acc, correct: c, incorrect: inc, total, timeTaken });
      return;
    }
    setQIndex(next);
    setQuestion(generateSwitchQuestion(difficulty, next.toString()));
    setSelected(null);
    setFeedback(null);
  }, [qIndex, questionCount, correct, incorrect, startTime, timeLimit, onComplete, difficulty]);

  const { seconds } = useTimer(QUESTION_TIME > 0 ? QUESTION_TIME : 60,
    () => { if (mode !== 'quick') nextQuestion(false); },
    mode !== 'quick'
  );

  const handleSelect = (idx: number) => {
    if (feedback !== null) return;
    setSelected(idx);
    const isCorrect = idx === question.correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect(c => c + 1);
    else setIncorrect(i => i + 1);
    setTimeout(() => {
      nextQuestion(isCorrect);
    }, 1000);
  };

  const gridSize = Math.min(90, Math.floor(Math.min(280, window.innerWidth - 80) / 2));

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge">Q {qIndex + 1}/{questionCount}</span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--green)', fontSize: '0.875rem', fontWeight: 700 }}>✓ {correct}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.875rem', fontWeight: 700 }}>✗ {incorrect}</span>
          {mode !== 'quick' && <span className={`timer-display${seconds <= 10 ? ' danger' : seconds <= 20 ? ' warning' : ''}`}>{formatTime(seconds)}</span>}
        </div>
      </div>

      {/* Rule display */}
      <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1.25rem', background: 'var(--accent-light)' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          🔍 Identify the transformation rule. Which option shows the correct "After" state?
        </p>
      </div>

      {/* Before → After example */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.375rem', fontWeight: 600 }}>BEFORE</p>
          <ShapeGrid shapes={question.before} size={gridSize} />
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.375rem', fontWeight: 600 }}>AFTER</p>
          <ShapeGrid shapes={question.after} size={gridSize} />
        </div>
      </div>

      {/* Options */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>
        Now apply the same rule. Select the correct "After" for a new arrangement:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            style={{
              padding: '0.875rem',
              border: `2px solid ${selected === i ? (feedback === 'correct' && i === question.correct ? 'var(--green)' : feedback === 'wrong' && i === selected ? 'var(--red)' : 'var(--accent)') : 'var(--border)'}`,
              background: selected === i ? (feedback === 'correct' && i === question.correct ? 'var(--green-light)' : feedback === 'wrong' ? 'var(--red-light)' : 'var(--accent-light)') : 'var(--bg-card)',
              cursor: feedback ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.15s',
            }}
            onClick={() => handleSelect(i)}
          >
            <ShapeGrid
              shapes={opt}
              size={Math.min(80, gridSize - 10)}
              selected={selected === i}
              correct={feedback !== null && i === question.correct}
              wrong={feedback === 'wrong' && selected === i}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Option {String.fromCharCode(65 + i)}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`card animate-scale-in`} style={{ padding: '0.875rem 1rem', marginTop: '0.875rem', background: feedback === 'correct' ? 'var(--green-light)' : 'var(--red-light)', border: `1px solid ${feedback === 'correct' ? 'var(--green)' : 'var(--red)'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {feedback === 'correct' ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />}
          <span style={{ fontWeight: 600, color: feedback === 'correct' ? 'var(--green)' : 'var(--red)', fontSize: '0.875rem' }}>
            {feedback === 'correct' ? 'Correct! Well spotted.' : 'Incorrect. Moving to next question.'}
          </span>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

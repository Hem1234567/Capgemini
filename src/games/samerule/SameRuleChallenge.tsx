import { useState, useCallback } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { SameRuleQuestion, SwitchShape } from '../../types';
import { generateSameRuleQuestion } from './sameRuleEngine';
import { useTimer } from '../../utils/timer';
import { formatTime } from '../../utils/scoring';
import { LogOut, CheckCircle, XCircle } from 'lucide-react';

// SVG shape grid renderer (same as SwitchChallenge)
function ShapeGrid({ shapes, size = 80, border = 'var(--border)' }: { shapes: SwitchShape[]; size?: number; border?: string }) {
  const cellSize = size / 3;
  return (
    <svg width={size} height={size} style={{ border: `2px solid ${border}`, background: 'var(--bg-input)', flexShrink: 0 }}>
      {[1, 2].map(i => (
        <line key={`h${i}`} x1={0} y1={i * cellSize} x2={size} y2={i * cellSize} stroke="var(--border)" strokeWidth={0.5} />
      ))}
      {[1, 2].map(i => (
        <line key={`v${i}`} x1={i * cellSize} y1={0} x2={i * cellSize} y2={size} stroke="var(--border)" strokeWidth={0.5} />
      ))}
      {shapes.map(shape => {
        const row = Math.floor(shape.position / 3);
        const col = shape.position % 3;
        const x = col * cellSize, y = row * cellSize;
        const cx = x + cellSize / 2, cy = y + cellSize / 2;
        const r = cellSize * 0.3;
        const { color } = shape;
        return (
          <g key={shape.position}>
            {shape.shape === 'circle' && <circle cx={cx} cy={cy} r={r} fill={color} />}
            {shape.shape === 'square' && <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={color} />}
            {shape.shape === 'triangle' && <polygon points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`} fill={color} />}
            {shape.shape === 'star' && (
              <polygon
                points={Array.from({ length: 10 }, (_, i) => {
                  const angle = (i * Math.PI) / 5 - Math.PI / 2;
                  const rad = i % 2 === 0 ? r : r * 0.4;
                  return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
                }).join(' ')}
                fill={color}
              />
            )}
            {shape.shape === 'diamond' && <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} fill={color} />}
          </g>
        );
      })}
    </svg>
  );
}

export default function SameRuleChallenge({ difficulty, mode, questionCount, timeLimit, onComplete, onExit }: GameComponentProps) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<SameRuleQuestion>(() => generateSameRuleQuestion(difficulty, '0'));
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime] = useState(Date.now());

  const nextQ = useCallback((wasCorrect: boolean) => {
    const next = qIndex + 1;
    if (next >= questionCount) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const c = wasCorrect ? correct + 1 : correct;
      const inc = !wasCorrect ? incorrect + 1 : incorrect;
      const acc = Math.round((c / questionCount) * 100);
      onComplete({ score: Math.min(100, acc + 15), accuracy: acc, correct: c, incorrect: inc, total: questionCount, timeTaken });
      return;
    }
    setQIndex(next);
    setQuestion(generateSameRuleQuestion(difficulty, next.toString()));
    setSelected(null);
    setFeedback(null);
  }, [qIndex, questionCount, correct, incorrect, startTime, onComplete, difficulty]);

  const { seconds } = useTimer(
    mode !== 'quick' ? Math.ceil(timeLimit / questionCount) : 60,
    () => { if (feedback === null) { setFeedback('wrong'); setIncorrect(i => i + 1); setTimeout(() => nextQ(false), 800); } },
    mode !== 'quick'
  );

  const handleSelect = (idx: number) => {
    if (feedback !== null) return;
    setSelected(idx);
    const isCorrect = idx === question.correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect(c => c + 1);
    else setIncorrect(i => i + 1);
    setTimeout(() => nextQ(isCorrect), 1000);
  };

  const gridSize = Math.min(75, Math.floor((Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 100 : 300)) / 2));

  return (
    <div style={{ padding: '1rem', maxWidth: 580, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge">Q {qIndex + 1}/{questionCount}</span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--green)', fontSize: '0.875rem', fontWeight: 700 }}>✓ {correct}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.875rem', fontWeight: 700 }}>✗ {incorrect}</span>
          {mode !== 'quick' && <span className={`timer-display${seconds <= 10 ? ' danger' : ''}`}>{formatTime(seconds)}</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1.25rem', background: 'var(--accent-light)' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Study the example transformation rule. Find which option follows the same rule.
        </p>
      </div>

      {/* Example pair */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Example transformation</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>BEFORE</p>
            <ShapeGrid shapes={question.exampleBefore} size={gridSize} />
          </div>
          <span style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>→</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>AFTER</p>
            <ShapeGrid shapes={question.exampleAfter} size={gridSize} />
          </div>
        </div>
      </div>

      {/* Options: show before → ? and player selects correct one */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Which of these arrangements, when the same rule is applied, produces the correct result?
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            style={{
              padding: '0.875rem',
              border: `2px solid ${selected === i ? (feedback === 'correct' && i === question.correct ? 'var(--green)' : 'var(--red)') : feedback !== null && i === question.correct ? 'var(--green)' : 'var(--border)'}`,
              background: selected === i ? (feedback === 'correct' ? 'var(--green-light)' : 'var(--red-light)') : feedback !== null && i === question.correct ? 'var(--green-light)' : 'var(--bg-card)',
              cursor: feedback ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
              transition: 'all 0.15s',
            }}
            onClick={() => handleSelect(i)}
          >
            <ShapeGrid
              shapes={opt}
              size={Math.min(70, gridSize)}
              border={selected === i ? (feedback === 'correct' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Option {String.fromCharCode(65 + i)}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <div className="card animate-scale-in" style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: feedback === 'correct' ? 'var(--green-light)' : 'var(--red-light)', border: `1px solid ${feedback === 'correct' ? 'var(--green)' : 'var(--red)'}` }}>
          {feedback === 'correct' ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />}
          <span style={{ fontWeight: 600, color: feedback === 'correct' ? 'var(--green)' : 'var(--red)', fontSize: '0.875rem' }}>
            {feedback === 'correct' ? 'Correct! You identified the right pattern.' : 'Incorrect. Study the transformation more carefully.'}
          </span>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

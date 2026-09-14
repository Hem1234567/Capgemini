import { useState, useCallback } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { ColorGridQuestion, ColorGridCell } from '../../types';
import { generateColorGridQuestion } from './colorGridEngine';
import { useTimer } from '../../utils/timer';
import { formatTime } from '../../utils/scoring';
import { LogOut, CheckCircle } from 'lucide-react';

const COLOR_MAP: Record<string, string> = {
  red: '#EF4444', blue: '#3B82F6', green: '#10B981',
  yellow: '#F59E0B', purple: '#8B5CF6', orange: '#F97316',
};

function CellShape({ cell, size }: { cell: ColorGridCell; size: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.32;
  const fill = COLOR_MAP[cell.color] ?? cell.color;

  return (
    <svg width={size} height={size}>
      {cell.shape === 'circle' && <circle cx={cx} cy={cy} r={r} fill={fill} />}
      {cell.shape === 'square' && <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={fill} />}
      {cell.shape === 'triangle' && <polygon points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`} fill={fill} />}
      {cell.shape === 'star' && (
        <polygon
          points={Array.from({ length: 10 }, (_, i) => {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.4;
            return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
          }).join(' ')}
          fill={fill}
        />
      )}
      {cell.value !== undefined && (
        <text x={cx} y={cy + r + 8} textAnchor="middle" fontSize={9} fill={fill} fontWeight="bold">{cell.value}</text>
      )}
    </svg>
  );
}

export default function ColorTheGrid({ difficulty, mode, questionCount, timeLimit, onComplete, onExit }: GameComponentProps) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<ColorGridQuestion>(() => generateColorGridQuestion(difficulty, '0'));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ correct: number; total: number; wrong: number } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime] = useState(Date.now());

  const nextQ = useCallback((c: number, inc: number) => {
    const next = qIndex + 1;
    if (next >= questionCount) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const totalC = correct + c;
      const totalInc = incorrect + inc;
      const acc = Math.round((totalC / Math.max(totalC + totalInc, 1)) * 100);
      onComplete({ score: Math.min(100, acc), accuracy: acc, correct: totalC, incorrect: totalInc, total: questionCount, timeTaken });
      return;
    }
    setQIndex(next);
    setQuestion(generateColorGridQuestion(difficulty, next.toString()));
    setSelected(new Set());
    setFeedback(null);
  }, [qIndex, questionCount, correct, incorrect, startTime, onComplete, difficulty]);

  const { seconds } = useTimer(
    mode !== 'quick' ? Math.ceil(timeLimit / questionCount) : 90,
    () => { submitAnswer(0, question.correctCells.length); },
    mode !== 'quick'
  );

  const toggleCell = (r: number, c: number) => {
    if (feedback) return;
    const key = `${r},${c}`;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submitAnswer = useCallback((extraC = 0, extraInc = 0) => {
    if (feedback) return;
    const correctSet = new Set(question.correctCells.map(([r, c]) => `${r},${c}`));
    let hit = 0, wrong = 0;
    for (const k of selected) {
      if (correctSet.has(k)) hit++;
      else wrong++;
    }
    const missed = correctSet.size - hit;
    const fb = { correct: hit, total: question.correctCells.length, wrong: wrong + missed };
    setFeedback(fb);
    const c = hit + extraC;
    const inc = (wrong + missed) + extraInc;
    setCorrect(prev => prev + c);
    setIncorrect(prev => prev + inc);
    setTimeout(() => nextQ(c, inc), 1200);
  }, [feedback, question, selected, nextQ]);

  const cellSize = Math.min(52, Math.floor(260 / question.gridSize));
  const isCorrectCell = (r: number, c: number) => question.correctCells.some(([cr, cc]) => cr === r && cc === c);

  return (
    <div style={{ padding: '1rem', maxWidth: 520, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge">Q {qIndex + 1}/{questionCount}</span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--green)', fontSize: '0.875rem', fontWeight: 700 }}>✓ {correct}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.875rem', fontWeight: 700 }}>✗ {incorrect}</span>
          {mode !== 'quick' && <span className={`timer-display${seconds <= 15 ? ' danger' : ''}`}>{formatTime(seconds)}</span>}
        </div>
      </div>

      {/* Rule */}
      <div className="card" style={{ padding: '1rem 1.125rem', marginBottom: '1.25rem', background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>📋 {question.rule}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Click all matching cells, then submit.</p>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${question.gridSize}, ${cellSize}px)`, gap: 4, padding: 8, border: '2px solid var(--border)', background: 'var(--bg-game)' }}>
          {question.cells.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const isSel = selected.has(key);
              const showCorrect = feedback && isCorrectCell(r, c);
              const showWrong = feedback && isSel && !isCorrectCell(r, c);
              return (
                <button
                  key={key}
                  style={{
                    width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${showCorrect ? 'var(--green)' : showWrong ? 'var(--red)' : isSel ? 'var(--accent)' : 'var(--border)'}`,
                    background: showCorrect ? 'var(--green-light)' : showWrong ? 'var(--red-light)' : isSel ? 'var(--accent-light)' : 'var(--bg-card)',
                    cursor: feedback ? 'default' : 'pointer',
                    transition: 'all 0.12s',
                    transform: isSel ? 'scale(1.04)' : 'none',
                  }}
                  onClick={() => toggleCell(r, c)}
                  aria-label={`Row ${r + 1} Col ${c + 1}: ${cell.color} ${cell.shape}`}
                  aria-pressed={isSel}
                >
                  <CellShape cell={cell} size={cellSize - 8} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {feedback && (
        <div className="card animate-scale-in" style={{ padding: '0.875rem', marginBottom: '0.875rem', background: feedback.wrong === 0 ? 'var(--green-light)' : 'var(--red-light)', border: `1px solid ${feedback.wrong === 0 ? 'var(--green)' : 'var(--red)'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} color={feedback.wrong === 0 ? 'var(--green)' : 'var(--red)'} />
          <span style={{ fontWeight: 600, color: feedback.wrong === 0 ? 'var(--green)' : 'var(--red)', fontSize: '0.875rem' }}>
            {feedback.wrong === 0 ? 'Perfect! All correct.' : `${feedback.correct}/${feedback.total} correct, ${feedback.wrong} mistake(s)`}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {!feedback && (
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => submitAnswer()}>
            Submit ({selected.size} selected)
          </button>
        )}
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

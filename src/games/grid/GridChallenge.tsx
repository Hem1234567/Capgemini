import { useState, useCallback } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { GridQuestion } from '../../types';
import { generateGridQuestion, scoreGridAnswer } from './gridEngine';
import { useTimer } from '../../utils/timer';
import { LogOut } from 'lucide-react';

type Phase = 'memory' | 'distraction' | 'recall' | 'feedback';

export default function GridChallenge({ difficulty, questionCount, timeLimit, onComplete, onExit }: GameComponentProps) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<GridQuestion>(() => generateGridQuestion(difficulty, '0'));
  const [phase, setPhase] = useState<Phase>('memory');
  const [selected, setSelected] = useState<[number, number][]>([]);
  const [distractionAnswer, setDistractionAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime] = useState(Date.now());
  const [feedback, setFeedback] = useState<{ hit: number; miss: number; fp: number } | null>(null);

  const MEMORY_TIME =
    difficulty === 'beginner' ? 5 :
    difficulty === 'easy' ? 4 :
    difficulty === 'medium' ? 3 :
    difficulty === 'hard' ? 2 : 1;

  const advancePhase = useCallback(() => {
    if (phase === 'memory') setPhase('distraction');
    else if (phase === 'distraction') setPhase('recall');
  }, [phase]);

  const { seconds: memSec } = useTimer(MEMORY_TIME, advancePhase, true);

  const handleCellClick = (r: number, c: number) => {
    if (phase !== 'recall') return;
    const exists = selected.some(([sr, sc]) => sr === r && sc === c);
    if (exists) {
      setSelected(prev => prev.filter(([sr, sc]) => !(sr === r && sc === c)));
    } else {
      setSelected(prev => [...prev, [r, c] as [number, number]]);
    }
  };

  const handleSubmit = () => {
    const result = scoreGridAnswer(question.correctCells, selected);
    setFeedback(result);
    setCorrect(c => c + result.hit);
    setIncorrect(i => i + result.miss + result.fp);
    setPhase('feedback');
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = useCallback(() => {
    const next = qIndex + 1;
    if (next >= questionCount) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const total = questionCount;
      const acc = Math.round((correct / Math.max(total, 1)) * 100);
      const timeBonus = timeLimit > 0 ? Math.max(0, 20 - Math.floor(timeTaken / 30)) : 15;
      onComplete({
        score: Math.min(100, Math.round(acc * 0.8 + timeBonus)),
        accuracy: acc,
        correct,
        incorrect,
        total,
        timeTaken,
      });
      return;
    }
    setQIndex(next);
    setQuestion(generateGridQuestion(difficulty, next.toString()));
    setPhase('memory');
    setSelected([]);
    setDistractionAnswer(null);
    setFeedback(null);
  }, [qIndex, questionCount, correct, incorrect, startTime, timeLimit, onComplete, difficulty]);

  const gridSize = question.gridSize;
  const cellSize = Math.min(48, Math.floor(280 / gridSize));

  const isHighlighted = (r: number, c: number) =>
    question.memoryPhase.some(([hr, hc]) => hr === r && hc === c);
  const isSelected = (r: number, c: number) =>
    selected.some(([sr, sc]) => sr === r && sc === c);

  return (
    <div style={{ padding: '1rem', maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge">Q {qIndex + 1}/{questionCount}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {phase === 'memory' && `Memorize! ${memSec}s`}
          {phase === 'distraction' && '🧩 Answer the distraction task'}
          {phase === 'recall' && '🧠 Recall the highlighted cells'}
          {phase === 'feedback' && '✅ Result'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 700 }}>✓ {correct}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--red)', fontWeight: 700 }}>✗ {incorrect}</span>
        </div>
      </div>

      {/* MEMORY phase */}
      {(phase === 'memory' || phase === 'feedback') && (
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>
            {phase === 'memory' ? `Memorize the highlighted cells (${question.memoryPhase.length} cells)` : 'Correct positions:'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: 4, padding: 8, border: '2px solid var(--border)', background: 'var(--bg-game)' }}>
              {Array.from({ length: gridSize }, (_, r) =>
                Array.from({ length: gridSize }, (_, c) => {
                  const highlighted = isHighlighted(r, c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      style={{
                        width: cellSize, height: cellSize,
                        background: highlighted ? 'var(--accent)' : 'var(--bg-input)',
                        border: `1px solid ${highlighted ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.2s',
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISTRACTION phase */}
      {phase === 'distraction' && (
        <div className="card animate-fade-in" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1rem' }}>
            {question.distractionTask.question}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {question.distractionTask.options.map((opt, i) => (
              <button
                key={i}
                className={distractionAnswer === i ? 'btn-primary' : 'btn-secondary'}
                onClick={() => { setDistractionAnswer(i); setTimeout(() => setPhase('recall'), 400); }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RECALL phase */}
      {phase === 'recall' && (
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>
            Click the cells you memorized ({question.correctCells.length} cells)
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, gap: 4, padding: 8, border: '2px solid var(--border)', background: 'var(--bg-game)' }}>
              {Array.from({ length: gridSize }, (_, r) =>
                Array.from({ length: gridSize }, (_, c) => {
                  const sel = isSelected(r, c);
                  return (
                    <button
                      key={`${r}-${c}`}
                      style={{
                        width: cellSize, height: cellSize,
                        background: sel ? 'var(--accent)' : 'var(--bg-input)',
                        border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.12s',
                        transform: sel ? 'scale(1.05)' : 'none',
                      }}
                      onClick={() => handleCellClick(r, c)}
                      aria-label={`Row ${r + 1} Column ${c + 1}${sel ? ' selected' : ''}`}
                    />
                  );
                })
              )}
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit}>
            Submit Selection ({selected.length} selected)
          </button>
        </div>
      )}

      {feedback && phase === 'feedback' && (
        <div className="card animate-scale-in" style={{ padding: '1rem', marginTop: '0.75rem', background: feedback.hit === question.correctCells.length ? 'var(--green-light)' : 'var(--red-light)', border: `1px solid ${feedback.hit === question.correctCells.length ? 'var(--green)' : 'var(--red)'}` }}>
          <p style={{ fontWeight: 700, color: feedback.hit === question.correctCells.length ? 'var(--green)' : 'var(--red)' }}>
            {feedback.hit === question.correctCells.length ? '✅ Perfect recall!' : `Hit ${feedback.hit}/${question.correctCells.length}, Missed ${feedback.miss}, Wrong ${feedback.fp}`}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

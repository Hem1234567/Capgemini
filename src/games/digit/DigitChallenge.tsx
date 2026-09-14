import { useState, useCallback, useEffect } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { DigitQuestion } from '../../types';
import { generateDigitQuestion, evaluateExpression } from './digitEngine';
import { useTimer } from '../../utils/timer';
import { formatTime } from '../../utils/scoring';
import { LogOut, Delete, CheckCircle, XCircle } from 'lucide-react';

export default function DigitChallenge({ difficulty, mode, questionCount, onComplete, onExit }: GameComponentProps) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<DigitQuestion>(() => generateDigitQuestion(difficulty, '0'));
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime] = useState(Date.now());

  const QUESTION_TIME = mode === 'quick' ? 60 : question.timeLimit;

  const nextQuestion = useCallback((wasCorrect: boolean) => {
    const next = qIndex + 1;
    if (next >= questionCount) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const c = wasCorrect ? correct + 1 : correct;
      const inc = !wasCorrect ? incorrect + 1 : incorrect;
      const acc = Math.round((c / questionCount) * 100);
      const tBonus = Math.max(0, 15 - Math.floor(timeTaken / 30));
      onComplete({ score: Math.min(100, acc + tBonus), accuracy: acc, correct: c, incorrect: inc, total: questionCount, timeTaken });
      return;
    }
    setQIndex(next);
    setQuestion(generateDigitQuestion(difficulty, next.toString()));
    setInput('');
    setFeedback(null);
  }, [qIndex, questionCount, correct, incorrect, startTime, onComplete, difficulty]);

  const { seconds } = useTimer(QUESTION_TIME, () => {
    if (feedback === null) {
      setFeedback('wrong');
      setIncorrect(i => i + 1);
      setTimeout(() => nextQuestion(false), 1000);
    }
  }, true);

  const handleSubmit = () => {
    if (feedback !== null || !input.trim()) return;
    const result = evaluateExpression(input.trim());
    if (result !== null && Math.abs(result - question.target) < 0.001) {
      setFeedback('correct');
      setCorrect(c => c + 1);
      setTimeout(() => { nextQuestion(true); }, 800);
    } else {
      setFeedback('wrong');
      setIncorrect(i => i + 1);
      setTimeout(() => { nextQuestion(false); }, 800);
    }
  };

  const handleDigitBtn = (d: number | string) => {
    if (feedback !== null) return;
    setInput(prev => prev + d);
  };
  const handleBackspace = () => setInput(prev => prev.slice(0, -1));
  const handleClear = () => setInput('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [input, feedback]);

  return (
    <div style={{ padding: '1rem', maxWidth: 520, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge">Q {qIndex + 1}/{questionCount}</span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--green)', fontSize: '0.875rem', fontWeight: 700 }}>✓ {correct}</span>
          <span style={{ color: 'var(--red)', fontSize: '0.875rem', fontWeight: 700 }}>✗ {incorrect}</span>
          <span className={`timer-display${seconds <= 10 ? ' danger' : seconds <= 20 ? ' warning' : ''}`}>{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Target */}
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>TARGET NUMBER</p>
        <p style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{question.target}</p>
      </div>

      {/* Available digits */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
          Available digits: <span style={{ fontWeight: 400 }}>(you may use any digit)</span>
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {question.availableDigits.map((d, i) => (
            <button
              key={i}
              className="btn-secondary"
              style={{ width: 44, height: 44, fontWeight: 700, fontSize: '1.125rem', padding: 0, justifyContent: 'center' }}
              onClick={() => handleDigitBtn(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Operations */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Permitted operations:</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {question.allowedOps.map(op => (
            <button
              key={op}
              className="btn-secondary"
              style={{ width: 44, height: 44, fontWeight: 700, fontSize: '1.25rem', padding: 0, justifyContent: 'center' }}
              onClick={() => handleDigitBtn(` ${op} `)}
            >
              {op}
            </button>
          ))}
          <button
            className="btn-secondary"
            style={{ width: 44, height: 44, fontWeight: 700, fontSize: '1rem', padding: 0, justifyContent: 'center' }}
            onClick={() => handleDigitBtn('(')}
          >
            (
          </button>
          <button
            className="btn-secondary"
            style={{ width: 44, height: 44, fontWeight: 700, fontSize: '1rem', padding: 0, justifyContent: 'center' }}
            onClick={() => handleDigitBtn(')')}
          >
            )
          </button>
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', alignItems: 'center' }}>
        <input
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your expression, e.g. 2 + 3 * 5"
          style={{ fontFamily: 'monospace', fontSize: '1rem', flex: 1 }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <button className="btn-ghost" onClick={handleBackspace} title="Backspace"><Delete size={18} /></button>
        <button className="btn-ghost" onClick={handleClear} title="Clear" style={{ fontSize: '0.75rem' }}>C</button>
      </div>

      {/* Expression preview */}
      {input && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.875rem', fontFamily: 'monospace' }}>
          = {(() => { const r = evaluateExpression(input); return r !== null ? r : '?'; })()}
        </div>
      )}

      {feedback && (
        <div className="card animate-scale-in" style={{ padding: '0.875rem 1rem', marginBottom: '0.875rem', background: feedback === 'correct' ? 'var(--green-light)' : 'var(--red-light)', border: `1px solid ${feedback === 'correct' ? 'var(--green)' : 'var(--red)'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {feedback === 'correct' ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />}
          <span style={{ fontWeight: 600, color: feedback === 'correct' ? 'var(--green)' : 'var(--red)', fontSize: '0.875rem' }}>
            {feedback === 'correct' ? `Correct! ${input} = ${question.target} ✓` : `Incorrect. The answer was: ${question.answer}`}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit} disabled={!input.trim() || feedback !== null}>
          Submit
        </button>
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

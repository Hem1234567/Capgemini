import { useState, useCallback } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { GeoSudoBoard } from '../../types';
import { generateGeoSudoBoard, validateGeoSudoMove, isGeoSudoComplete, countCorrect } from './geosudoEngine';
import { useTimer } from '../../utils/timer';
import { formatTime } from '../../utils/scoring';
import { LogOut, CheckCircle } from 'lucide-react';

export default function GeoSudo({ difficulty, mode, questionCount, timeLimit, onComplete, onExit }: GameComponentProps) {
  const [puzzleIndex, setPuzzleIndex] = useState(1);
  const [board, setBoard] = useState<GeoSudoBoard>(() => generateGeoSudoBoard(difficulty));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime] = useState(Date.now());
  const [won, setWon] = useState(false);

  const nextPuzzle = useCallback((b = board) => {
    const { correct: c, total: t } = countCorrect(b);
    setCorrect(prev => prev + c);
    setTotal(prev => prev + t);
    if (puzzleIndex >= questionCount) {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const allC = correct + c;
      const allT = total + t;
      const acc = Math.round((allC / Math.max(allT, 1)) * 100);
      onComplete({ score: Math.min(100, acc), accuracy: acc, correct: allC, incorrect: allT - allC, total: allT, timeTaken });
      return;
    }
    setPuzzleIndex(p => p + 1);
    setBoard(generateGeoSudoBoard(difficulty));
    setSelectedCell(null);
    setErrors(new Set());
    setWon(false);
  }, [board, puzzleIndex, questionCount, correct, total, startTime, onComplete, difficulty]);

  const { seconds } = useTimer(
    timeLimit > 0 ? Math.ceil(timeLimit / questionCount) : 300,
    () => nextPuzzle(),
    mode !== 'quick'
  );

  const handleCellClick = (r: number, c: number) => {
    if (board.givenCells[r][c]) return;
    setSelectedCell([r, c]);
  };

  const handleSymbolSelect = (symbol: string) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (board.givenCells[r][c]) return;

    const newBoard = { ...board, grid: board.grid.map(row => [...row]) };
    newBoard.grid[r][c] = symbol;

    const valid = validateGeoSudoMove(newBoard, r, c, symbol);
    const errKey = `${r},${c}`;
    const newErrors = new Set(errors);
    if (!valid) newErrors.add(errKey);
    else newErrors.delete(errKey);

    setErrors(newErrors);
    setBoard(newBoard);

    if (isGeoSudoComplete(newBoard)) setWon(true);
  };

  const cellSize = Math.min(52, Math.floor(280 / board.size));

  return (
    <div style={{ padding: '1rem', maxWidth: 520, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge">Puzzle {puzzleIndex}/{questionCount}</span>
        {mode !== 'quick' && <span className={`timer-display${seconds <= 30 ? ' danger' : ''}`}>{formatTime(seconds)}</span>}
      </div>

      {/* Instructions */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--accent-light)' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          Fill the grid so every row and column contains each symbol exactly once.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${board.size}, ${cellSize}px)`, gap: 3, padding: 8, border: '2px solid var(--border)', background: 'var(--bg-game)' }}>
          {board.grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const isGiven = board.givenCells[r][c];
              const hasError = errors.has(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize > 44 ? '1.375rem' : '1rem', fontWeight: isGiven ? 700 : 500,
                    border: `2px solid ${hasError ? 'var(--red)' : isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: hasError ? 'var(--red-light)' : isSelected ? 'var(--accent-light)' : isGiven ? 'var(--bg-input)' : 'var(--bg-card)',
                    color: hasError ? 'var(--red)' : isGiven ? 'var(--text-primary)' : 'var(--accent)',
                    cursor: isGiven ? 'not-allowed' : 'pointer',
                    transition: 'all 0.12s',
                  }}
                  onClick={() => handleCellClick(r, c)}
                  aria-label={`Row ${r + 1} Col ${c + 1}: ${cell ?? 'empty'}${isGiven ? ' (given)' : ''}`}
                >
                  {cell ?? ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Symbol palette */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {selectedCell ? `Placing in Row ${selectedCell[0] + 1}, Col ${selectedCell[1] + 1}` : 'Click an empty cell, then pick a symbol'}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {board.symbols.map(sym => (
            <button
              key={sym}
              className={selectedCell ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '1.25rem', width: 44, height: 44, padding: 0, justifyContent: 'center' }}
              onClick={() => handleSymbolSelect(sym)}
              disabled={!selectedCell}
            >
              {sym}
            </button>
          ))}
          <button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0 0.75rem', height: 44 }}
            onClick={() => {
              if (!selectedCell) return;
              const [r, c] = selectedCell;
              if (board.givenCells[r][c]) return;
              const nb = { ...board, grid: board.grid.map(row => [...row]) };
              nb.grid[r][c] = null;
              setBoard(nb);
              const newErrors = new Set(errors);
              newErrors.delete(`${r},${c}`);
              setErrors(newErrors);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {won && (
        <div className="card animate-scale-in" style={{ padding: '1rem', background: 'var(--green-light)', border: '1px solid var(--green)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} color="var(--green)" />
          <span style={{ fontWeight: 700, color: 'var(--green)' }}>Puzzle Complete! 🎉</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {(won || true) && (
          <button className="btn-primary" onClick={() => nextPuzzle()} style={{ flex: 1, justifyContent: 'center' }}>
            {puzzleIndex >= questionCount ? 'Finish & See Results' : won ? 'Next Puzzle →' : 'Submit & Next'}
          </button>
        )}
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

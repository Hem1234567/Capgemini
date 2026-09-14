import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameComponentProps } from '../GameShell';
import type { MotionBoard } from '../../types';
import { generateMotionBoard, movePlayer, moveBlock, checkWin } from './motionEngine';
import { useTimer } from '../../utils/timer';
import { formatTime } from '../../utils/scoring';
import { RotateCcw, LogOut, Target, Footprints, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const CELL_TYPE_COLORS = {
  empty: 'var(--bg-input)',
  obstacle: 'var(--border)',
  player: 'var(--accent)',
  target: 'var(--green)',
  movable: '#F59E0B',
};

const CELL_ICONS: Record<string, string> = {
  player: '🔵',
  target: '⭐',
  obstacle: '⬛',
  movable: '🟦',
  empty: '',
};

// Direction vectors for arrow keys
const DIRECTIONS: Record<string, [number, number]> = {
  ArrowUp:    [-1,  0],
  ArrowDown:  [ 1,  0],
  ArrowLeft:  [ 0, -1],
  ArrowRight: [ 0,  1],
};

export default function MotionChallenge({ difficulty, mode, questionCount, timeLimit, onComplete, onExit }: GameComponentProps) {
  const [board, setBoard] = useState<MotionBoard>(() => generateMotionBoard(difficulty));
  const [moves, setMoves] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(1);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [lastKey, setLastKey] = useState<string>('');
  const totalMoves = useRef(0);
  const totalOptimal = useRef(0);
  const boardRef = useRef(board);
  const wonRef = useRef(won);
  const movesRef = useRef(moves);
  const puzzleIndexRef = useRef(puzzleIndex);

  // Keep refs in sync
  boardRef.current = board;
  wonRef.current = won;
  movesRef.current = moves;
  puzzleIndexRef.current = puzzleIndex;

  const handleExpire = useCallback(() => {
    if (puzzleIndexRef.current < questionCount) {
      nextPuzzle();
    } else {
      finish();
    }
  }, [questionCount]);

  const { seconds, start: startTimer, reset: resetTimer } = useTimer(
    timeLimit > 0 ? Math.ceil(timeLimit / questionCount) : 180,
    handleExpire,
    mode !== 'quick'
  );

  useEffect(() => {
    if (mode !== 'quick') startTimer();
  }, []);

  const nextPuzzle = useCallback(() => {
    totalMoves.current += movesRef.current;
    totalOptimal.current += boardRef.current.optimalMoves;
    if (puzzleIndexRef.current >= questionCount) {
      finish();
      return;
    }
    setBoard(generateMotionBoard(difficulty));
    setMoves(0);
    setWon(false);
    setSelectedCell(null);
    setPuzzleIndex(p => p + 1);
    resetTimer(mode !== 'quick' ? Math.ceil(timeLimit / questionCount) : 180);
    if (mode !== 'quick') setTimeout(() => startTimer(), 50);
  }, [questionCount, difficulty, mode, timeLimit, resetTimer, startTimer]);

  const finish = useCallback(() => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const eff = totalOptimal.current > 0 ? totalOptimal.current / Math.max(totalMoves.current, 1) : 1;
    const effScore = Math.min(1, eff);
    const baseScore = Math.round(effScore * 70 + (score / Math.max(puzzleIndexRef.current - 1, 1)) * 30);
    onComplete({
      score: Math.min(100, baseScore),
      accuracy: Math.round(effScore * 100),
      correct: puzzleIndexRef.current - 1,
      incorrect: 0,
      total: questionCount,
      timeTaken,
      efficiency: Math.round(effScore * 100),
      moves: totalMoves.current,
      optimalMoves: totalOptimal.current,
    });
  }, [startTime, score, questionCount, onComplete]);

  // ── Shared move logic used by both click and keyboard/dpad ──
  const tryMovePlayer = useCallback((targetRow: number, targetCol: number) => {
    if (wonRef.current) return;
    const currentBoard = boardRef.current;
    const newBoard = movePlayer(currentBoard, [targetRow, targetCol]);
    if (newBoard) {
      setBoard(newBoard);
      setMoves(m => m + 1);
      setSelectedCell(null);
      if (checkWin(newBoard)) {
        const puzzleScore = Math.max(0, 100 - movesRef.current * 10);
        setScore(s => s + puzzleScore);
        setWon(true);
        totalMoves.current += movesRef.current + 1;
        totalOptimal.current += newBoard.optimalMoves;
      }
    }
  }, []);

  // ── Arrow key handler ──
  const handleArrowKey = useCallback((key: string) => {
    if (wonRef.current) return;
    const dir = DIRECTIONS[key];
    if (!dir) return;
    const [pr, pc] = boardRef.current.playerPos;
    const [dr, dc] = dir;
    setLastKey(key);
    setTimeout(() => setLastKey(''), 200);
    tryMovePlayer(pr + dr, pc + dc);
  }, [tryMovePlayer]);

  // ── Keyboard listener ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleArrowKey(e.key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleArrowKey]);

  // ── Cell click handler ──
  const handleCellClick = useCallback((r: number, c: number) => {
    if (won) return;
    const cell = board.grid[r][c];

    if (selectedCell) {
      const [sr, sc] = selectedCell;
      const srcCell = board.grid[sr][sc];

      if (srcCell.type === 'player') {
        tryMovePlayer(r, c);
        return;
      } else if (srcCell.type === 'movable') {
        const newBoard = moveBlock(board, [sr, sc], [r, c]);
        if (newBoard) {
          setBoard(newBoard);
          setMoves(m => m + 1);
          setSelectedCell(null);
          return;
        }
      }
      setSelectedCell([r, c]);
      return;
    }

    if (cell.type === 'player' || cell.type === 'movable') {
      setSelectedCell([r, c]);
    }
  }, [board, won, selectedCell, tryMovePlayer]);

  const resetPuzzle = () => {
    setBoard(generateMotionBoard(difficulty));
    setMoves(0);
    setWon(false);
    setSelectedCell(null);
  };

  const cellSize = Math.min(56, Math.floor(300 / board.size));

  // D-pad button style helper
  const dpadBtnStyle = (key: string): React.CSSProperties => ({
    width: 52,
    height: 52,
    border: `2px solid var(--border)`,
    background: lastKey === key ? 'var(--text-primary)' : 'var(--bg)',
    color: lastKey === key ? 'var(--bg)' : 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'all 0.1s',
    fontSize: '1rem',
    fontWeight: 700,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });

  return (
    <div style={{ padding: '1rem', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge">Puzzle {puzzleIndex}/{questionCount}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <Footprints size={14} /> {moves} moves
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <Target size={14} /> optimal: {board.optimalMoves}
          </span>
        </div>
        {mode !== 'quick' && (
          <span className={`timer-display${seconds <= 10 ? ' danger' : seconds <= 30 ? ' warning' : ''}`}>
            {formatTime(seconds)}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="notice-banner" style={{ marginBottom: '0.875rem', fontSize: '0.8rem' }}>
        🔵 Player &nbsp;⭐ Target &nbsp;🟦 Movable block &nbsp;⬛ Obstacle
        <br />Click a piece to select, then click its destination. Or use arrow keys / D-pad.
        {selectedCell && <> &nbsp;· <strong>Selected: [{selectedCell[0]},{selectedCell[1]}]</strong></>}
      </div>

      {/* Game area: grid + dpad side by side on wider screens */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>

        {/* Grid */}
        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${board.size}, ${cellSize}px)`,
            gap: 4,
            background: 'var(--bg-game)',
            padding: 8,
            border: '4px solid var(--border)',
          }}
          role="grid"
          aria-label="Motion Challenge game board"
        >
          {board.grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const bg = CELL_TYPE_COLORS[cell.type] ?? 'var(--bg-input)';
              return (
                <button
                  key={`${r}-${c}`}
                  role="gridcell"
                  aria-label={`Row ${r + 1} Column ${c + 1}: ${cell.type}`}
                  style={{
                    width: cellSize, height: cellSize,
                    border: `2px solid ${isSelected ? 'var(--accent)' : cell.type === 'target' ? 'var(--green)' : 'var(--border)'}`,
                    background: bg,
                    cursor: (cell.type === 'player' || cell.type === 'movable' || selectedCell) ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize > 40 ? '1.25rem' : '0.875rem',
                    transition: 'all 0.12s',
                    boxShadow: isSelected ? '0 0 0 3px rgba(79,70,229,.3)' : 'none',
                    transform: isSelected ? 'scale(1.06)' : 'none',
                  }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {CELL_ICONS[cell.type]}
                </button>
              );
            })
          )}
        </div>

        {/* D-pad controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          {/* Label */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            marginBottom: '0.25rem',
          }}>
            Controls
          </div>

          {/* Up */}
          <button
            style={dpadBtnStyle('ArrowUp')}
            onClick={() => handleArrowKey('ArrowUp')}
            aria-label="Move Up"
            title="Move Up (↑)"
          >
            <ArrowUp size={22} />
          </button>

          {/* Middle row: Left + Center + Right */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              style={dpadBtnStyle('ArrowLeft')}
              onClick={() => handleArrowKey('ArrowLeft')}
              aria-label="Move Left"
              title="Move Left (←)"
            >
              <ArrowLeft size={22} />
            </button>

            {/* Center placeholder */}
            <div style={{
              width: 52, height: 52,
              border: '2px solid var(--border)',
              background: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.3,
            }}>
              🔵
            </div>

            <button
              style={dpadBtnStyle('ArrowRight')}
              onClick={() => handleArrowKey('ArrowRight')}
              aria-label="Move Right"
              title="Move Right (→)"
            >
              <ArrowRight size={22} />
            </button>
          </div>

          {/* Down */}
          <button
            style={dpadBtnStyle('ArrowDown')}
            onClick={() => handleArrowKey('ArrowDown')}
            aria-label="Move Down"
            title="Move Down (↓)"
          >
            <ArrowDown size={22} />
          </button>

          {/* Keyboard hint */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Arrow keys<br />also work
          </div>
        </div>
      </div>

      {/* Win state */}
      {won && (
        <div className="card animate-scale-in" style={{ padding: '1.25rem', background: 'var(--green-light)', border: '1px solid var(--green)', marginBottom: '1rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: '1.125rem', marginBottom: '0.25rem' }}>✅ Puzzle Solved!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Moves: {moves + 1} &nbsp;/&nbsp; Optimal: {board.optimalMoves}</p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {won && puzzleIndex < questionCount && (
          <button className="btn-primary" onClick={nextPuzzle}>Next Puzzle →</button>
        )}
        {won && puzzleIndex >= questionCount && (
          <button className="btn-primary" onClick={finish}>Finish & See Results</button>
        )}
        <button className="btn-secondary" onClick={resetPuzzle}><RotateCcw size={14} /> Reset</button>
        <button className="btn-secondary" onClick={nextPuzzle} style={{ fontSize: '0.8125rem' }}>Skip</button>
        <button className="btn-ghost" onClick={onExit}><LogOut size={14} /> Exit</button>
      </div>
    </div>
  );
}

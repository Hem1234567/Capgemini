import type { MotionBoard, MotionCell, Difficulty } from '../../types';

function posKey(r: number, c: number): string {
  return `${r},${c}`;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFF_CONFIG = {
  beginner: { size: 4, obstacles: 2, movable: 1 },
  easy:     { size: 4, obstacles: 3, movable: 2 },
  medium:   { size: 5, obstacles: 5, movable: 3 },
  hard:     { size: 6, obstacles: 8, movable: 4 },
  expert:   { size: 7, obstacles: 11, movable: 5 },
};

// Generate all cells in grid, shuffled, for random non-colliding placement
function allCellsShuffled(size: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      cells.push([r, c]);
  return shuffle(cells);
}

export function generateMotionBoard(difficulty: Difficulty): MotionBoard {
  const cfg = DIFF_CONFIG[difficulty];
  const { size } = cfg;

  // Pick all positions from a shuffled list — guarantees no duplicates
  // and no fixed-corner bias
  const cells = allCellsShuffled(size);
  let idx = 0;

  const playerPos = cells[idx++];
  const targetPos = cells[idx++];

  const occupied = new Set<string>();
  occupied.add(posKey(...playerPos));
  occupied.add(posKey(...targetPos));

  // Ensure player & target are at least 2 apart (min interesting distance)
  const dist = Math.abs(playerPos[0] - targetPos[0]) + Math.abs(playerPos[1] - targetPos[1]);
  if (dist < 2) {
    // Re-generate from scratch (tail-call safe iteration)
    return generateMotionBoard(difficulty);
  }

  // Place obstacles
  const obstacles: [number, number][] = [];
  while (obstacles.length < cfg.obstacles && idx < cells.length) {
    const pos = cells[idx++];
    const key = posKey(...pos);
    if (!occupied.has(key)) {
      occupied.add(key);
      obstacles.push(pos);
    }
  }

  // Place movable blocks
  const movableBlocks: [number, number][] = [];
  while (movableBlocks.length < cfg.movable && idx < cells.length) {
    const pos = cells[idx++];
    const key = posKey(...pos);
    if (!occupied.has(key)) {
      occupied.add(key);
      movableBlocks.push(pos);
    }
  }

  // Build grid
  const grid: MotionCell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ type: 'empty' as const }))
  );

  grid[playerPos[0]][playerPos[1]] = { type: 'player' };
  grid[targetPos[0]][targetPos[1]] = { type: 'target' };
  obstacles.forEach(([r, c]) => { grid[r][c] = { type: 'obstacle' }; });
  movableBlocks.forEach(([r, c], i) => { grid[r][c] = { type: 'movable', blockId: i }; });

  const optimalMoves = manhattanDistance(playerPos, targetPos) + movableBlocks.length;

  return { grid, size, playerPos, targetPos, optimalMoves };
}

function manhattanDistance([r1, c1]: [number, number], [r2, c2]: [number, number]): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

export function isAdjacentEmpty(
  grid: MotionCell[][],
  from: [number, number],
  to: [number, number]
): boolean {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const size = grid.length;
  if (tr < 0 || tr >= size || tc < 0 || tc >= size) return false;
  const dr = Math.abs(fr - tr), dc = Math.abs(fc - tc);
  if (dr + dc !== 1) return false;
  const cell = grid[tr][tc];
  return cell.type === 'empty' || cell.type === 'target';
}

export function canMoveBlock(
  grid: MotionCell[][],
  _blockPos: [number, number],
  to: [number, number]
): boolean {
  const [tr, tc] = to;
  const size = grid.length;
  if (tr < 0 || tr >= size || tc < 0 || tc >= size) return false;
  const cell = grid[tr][tc];
  return cell.type === 'empty';
}

export function movePlayer(
  board: MotionBoard,
  to: [number, number]
): MotionBoard | null {
  if (!isAdjacentEmpty(board.grid, board.playerPos, to)) return null;
  const newGrid = board.grid.map(row => row.map(cell => ({ ...cell })));
  const [pr, pc] = board.playerPos;
  const [tr, tc] = to;

  newGrid[pr][pc] = { type: 'empty' };
  newGrid[tr][tc] = { type: 'player' };

  return {
    ...board,
    grid: newGrid,
    playerPos: to,
    optimalMoves: board.optimalMoves,
  };
}

export function moveBlock(
  board: MotionBoard,
  blockPos: [number, number],
  to: [number, number]
): MotionBoard | null {
  if (!canMoveBlock(board.grid, blockPos, to)) return null;
  const newGrid = board.grid.map(row => row.map(cell => ({ ...cell })));
  const [br, bc] = blockPos;
  const [tr, tc] = to;
  const block = newGrid[br][bc];
  newGrid[br][bc] = { type: 'empty' };
  newGrid[tr][tc] = { ...block };
  return { ...board, grid: newGrid };
}

export function checkWin(board: MotionBoard): boolean {
  const [tr, tc] = board.targetPos;
  return board.grid[tr][tc].type === 'player';
}

import type { GeoSudoBoard, Difficulty } from '../../types';

const SYMBOL_SETS: Record<number, string[]> = {
  4: ['■', '▲', '●', '★'],
  5: ['■', '▲', '●', '★', '◆'],
  6: ['■', '▲', '●', '★', '◆', '♥'],
};

const DIFF_CONFIG: Record<Difficulty, { size: number; blanks: number }> = {
  beginner: { size: 4, blanks: 4 },
  easy: { size: 4, blanks: 6 },
  medium: { size: 5, blanks: 8 },
  hard: { size: 5, blanks: 12 },
  expert: { size: 6, blanks: 16 },
};

function shuffle<T>(arr: T[]): T[] {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function generateSolution(size: number, symbols: string[]): string[][] {
  // Generate a valid Latin square
  const base = symbols.slice(0, size);
  const grid = Array.from({ length: size }, (_, r) =>
    base.map((_, c) => base[(r + c) % size])
  );
  // Shuffle rows and columns to add variety
  const rowOrder = shuffle(Array.from({ length: size }, (_, i) => i));
  const colOrder = shuffle(Array.from({ length: size }, (_, i) => i));
  return rowOrder.map(r => colOrder.map(c => grid[r][c]));
}

export function generateGeoSudoBoard(difficulty: Difficulty): GeoSudoBoard {
  const cfg = DIFF_CONFIG[difficulty];
  const { size } = cfg;
  const symbols = SYMBOL_SETS[size] ?? SYMBOL_SETS[4];
  const solution = generateSolution(size, symbols);

  // Create puzzle by blanking out cells
  const grid: (string | null)[][] = solution.map(row => [...row]);
  const givenCells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(true));

  const allPositions: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) allPositions.push([r, c]);
  const blanks = shuffle(allPositions).slice(0, cfg.blanks);
  blanks.forEach(([r, c]) => {
    grid[r][c] = null;
    givenCells[r][c] = false;
  });

  return { size, symbols: symbols.slice(0, size), grid, solution, givenCells };
}

export function validateGeoSudoMove(board: GeoSudoBoard, row: number, col: number, symbol: string): boolean {
  // Check row
  for (let c = 0; c < board.size; c++) {
    if (c !== col && board.grid[row][c] === symbol) return false;
  }
  // Check column
  for (let r = 0; r < board.size; r++) {
    if (r !== row && board.grid[r][col] === symbol) return false;
  }
  return true;
}

export function isGeoSudoComplete(board: GeoSudoBoard): boolean {
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      if (board.grid[r][c] === null) return false;
      if (board.grid[r][c] !== board.solution[r][c]) return false;
    }
  }
  return true;
}

export function countCorrect(board: GeoSudoBoard): { correct: number; total: number } {
  let correct = 0, total = 0;
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      if (!board.givenCells[r][c]) {
        total++;
        if (board.grid[r][c] === board.solution[r][c]) correct++;
      }
    }
  }
  return { correct, total };
}

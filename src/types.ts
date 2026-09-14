// ─── Theme ────────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';

// ─── Difficulty ───────────────────────────────────────────────────────────────
export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

// ─── Practice mode ────────────────────────────────────────────────────────────
export type PracticeMode = 'quick' | 'standard' | 'timed' | 'mock';

// ─── Game IDs ─────────────────────────────────────────────────────────────────
export type GameId =
  | 'motion-challenge'
  | 'grid-challenge'
  | 'switch-challenge'
  | 'digit-challenge'
  | 'geo-sudo'
  | 'inductive-challenge'
  | 'color-the-grid'
  | 'same-rule-challenge';

// ─── Game meta info ───────────────────────────────────────────────────────────
export interface GameMeta {
  id: GameId;
  name: string;
  category: string;
  categoryTag: string;
  skill: string;
  description: string;
  suggestedTime: string;
  icon: string;
  color: string;
  difficulty: Difficulty[];
}

// ─── Attempt ──────────────────────────────────────────────────────────────────
export interface GameAttempt {
  id: string;
  gameId: GameId;
  gameName: string;
  difficulty: Difficulty;
  mode: PracticeMode;
  score: number;
  accuracy: number;
  timeTaken: number;
  correct: number;
  incorrect: number;
  total: number;
  efficiency?: number;
  timestamp: number;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface GameProgress {
  gameId: GameId;
  attempts: number;
  bestScore: number;
  avgScore: number;
  avgAccuracy: number;
  avgTime: number;
  currentDifficulty: Difficulty;
  highestDifficulty: Difficulty;
  lastAttempt: number;
}

export interface ProgressStore {
  attempts: GameAttempt[];
  gameProgress: Record<GameId, GameProgress>;
  totalAttempts: number;
  totalCompleted: number;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
export interface ScoreResult {
  score: number;
  accuracy: number;
  performance: 'excellent' | 'strong' | 'good' | 'needs-practice' | 'beginner';
  label: string;
  message: string;
  recommendedDifficulty: Difficulty;
}

// ─── Game question (generic) ──────────────────────────────────────────────────
export interface GameQuestion {
  id: string;
  correct?: number | string | number[];
  explanation?: string;
}

// ─── Motion Challenge ─────────────────────────────────────────────────────────
export type CellType = 'empty' | 'obstacle' | 'movable' | 'player' | 'target';

export interface MotionCell {
  type: CellType;
  blockId?: number;
}

export interface MotionBoard {
  grid: MotionCell[][];
  size: number;
  playerPos: [number, number];
  targetPos: [number, number];
  optimalMoves: number;
}

// ─── Grid Challenge ───────────────────────────────────────────────────────────
export interface GridQuestion {
  id: string;
  gridSize: number;
  memoryPhase: [number, number][];   // highlighted [row,col] pairs
  distractionTask: DistractionTask;
  correctCells: [number, number][];
}

export interface DistractionTask {
  type: 'symmetry' | 'shapes' | 'odd-one-out';
  question: string;
  options: string[];
  correct: number;
}

// ─── Switch Challenge ─────────────────────────────────────────────────────────
export type TransformRule =
  | 'rotate-90' | 'rotate-180' | 'reflect-h' | 'reflect-v'
  | 'color-swap' | 'position-swap' | 'count-change' | 'shape-change';

export interface SwitchShape {
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond';
  color: string;
  position: number; // 0-8 for 3x3 grid
  size: 'sm' | 'md' | 'lg';
}

export interface SwitchQuestion {
  id: string;
  rule: TransformRule;
  before: SwitchShape[];
  after: SwitchShape[];
  options: SwitchShape[][];  // 4 answer options
  correct: number;           // index into options
}

// ─── Digit Challenge ──────────────────────────────────────────────────────────
export interface DigitQuestion {
  id: string;
  target: number;
  availableDigits: number[];
  allowedOps: ('+' | '-' | '*' | '/')[]; 
  answer: string;  // valid expression
  timeLimit: number;
}

// ─── Geo-Sudo ─────────────────────────────────────────────────────────────────
export interface GeoSudoBoard {
  size: number;
  symbols: string[];
  grid: (string | null)[][];  // null = blank cell
  solution: string[][];
  givenCells: boolean[][];    // true = pre-filled (read-only)
}

// ─── Inductive Challenge ──────────────────────────────────────────────────────
export interface InductiveExample {
  input: string[];   // SVG-renderable description array
  output: string[];
}

export interface InductiveQuestion {
  id: string;
  rule: string;
  examples: InductiveExample[];
  testInput: string[];
  options: string[][];
  correct: number;
}

// ─── Color the Grid ───────────────────────────────────────────────────────────
export interface ColorGridCell {
  shape: 'circle' | 'square' | 'triangle' | 'star';
  color: string;
  value?: number;
}

export interface ColorGridQuestion {
  id: string;
  gridSize: number;
  cells: ColorGridCell[][];
  rule: string;
  correctCells: [number, number][];
}

// ─── Same Rule Challenge ──────────────────────────────────────────────────────
export interface SameRuleQuestion {
  id: string;
  rule: TransformRule;
  exampleBefore: SwitchShape[];
  exampleAfter: SwitchShape[];
  options: SwitchShape[][];  // 4 "before" options
  correct: number;           // which option, when transformed, gives a valid "after"
  optionAfters: SwitchShape[][];
}

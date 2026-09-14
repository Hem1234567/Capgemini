import type { ColorGridQuestion, ColorGridCell, Difficulty } from '../../types';

const SHAPES: ColorGridCell['shape'][] = ['circle', 'square', 'triangle', 'star'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const DIFF_CONFIG: Record<Difficulty, { gridSize: number; ruleComplexity: 'simple' | 'medium' | 'complex' }> = {
  beginner: { gridSize: 3, ruleComplexity: 'simple' },
  easy:     { gridSize: 4, ruleComplexity: 'simple' },
  medium:   { gridSize: 4, ruleComplexity: 'medium' },
  hard:     { gridSize: 5, ruleComplexity: 'medium' },
  expert:   { gridSize: 5, ruleComplexity: 'complex' },
};

function rand(max: number) { return Math.floor(Math.random() * max); }
function pick<T>(arr: T[]): T { return arr[rand(arr.length)]; }

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomCell(): ColorGridCell {
  return { shape: pick(SHAPES), color: pick(COLORS), value: rand(9) + 1 };
}

type Rule = {
  rule: string;
  matches: (cell: ColorGridCell, r: number, c: number, all: ColorGridCell[][]) => boolean;
};

const SIMPLE_RULES: Rule[] = [
  { rule: 'Select all cells with a circle',   matches: c => c.shape === 'circle' },
  { rule: 'Select all cells with a square',   matches: c => c.shape === 'square' },
  { rule: 'Select all cells with a triangle', matches: c => c.shape === 'triangle' },
  { rule: 'Select all cells with a star',     matches: c => c.shape === 'star' },
  { rule: 'Select all red cells',             matches: c => c.color === 'red' },
  { rule: 'Select all blue cells',            matches: c => c.color === 'blue' },
  { rule: 'Select all green cells',           matches: c => c.color === 'green' },
  { rule: 'Select all yellow cells',          matches: c => c.color === 'yellow' },
  { rule: 'Select all purple cells',          matches: c => c.color === 'purple' },
  { rule: 'Select all orange cells',          matches: c => c.color === 'orange' },
];

const MEDIUM_RULES: Rule[] = [
  { rule: 'Select all cells with a value greater than 5',  matches: c => (c.value ?? 0) > 5 },
  { rule: 'Select all cells with a value less than 5',     matches: c => (c.value ?? 1) < 5 },
  { rule: 'Select all cells with an even value',           matches: c => ((c.value ?? 0) % 2 === 0) },
  { rule: 'Select all cells with an odd value',            matches: c => ((c.value ?? 0) % 2 === 1) },
  { rule: 'Select all cells with a circle or a star',      matches: c => c.shape === 'circle' || c.shape === 'star' },
  { rule: 'Select all cells with a square or a triangle',  matches: c => c.shape === 'square' || c.shape === 'triangle' },
  { rule: 'Select all red or blue cells',                  matches: c => c.color === 'red' || c.color === 'blue' },
  { rule: 'Select all green or yellow cells',              matches: c => c.color === 'green' || c.color === 'yellow' },
  { rule: 'Select all cells with a value equal to 7',      matches: c => c.value === 7 },
  { rule: 'Select all cells with a value equal to 3',      matches: c => c.value === 3 },
];

const COMPLEX_RULES: Rule[] = [
  { rule: 'Select all red circles',   matches: c => c.shape === 'circle' && c.color === 'red' },
  { rule: 'Select all blue squares',  matches: c => c.shape === 'square' && c.color === 'blue' },
  { rule: 'Select all green triangles', matches: c => c.shape === 'triangle' && c.color === 'green' },
  { rule: 'Select all yellow stars',  matches: c => c.shape === 'star' && c.color === 'yellow' },
  { rule: 'Select cells in the first row',   matches: (_c, r) => r === 0 },
  { rule: 'Select cells in the last row',    matches: (_c, r, _col, all) => r === all.length - 1 },
  { rule: 'Select cells in the first column', matches: (_c, _r, col) => col === 0 },
  { rule: 'Select cells in the last column', matches: (_c, _r, col, all) => col === all[0].length - 1 },
  { rule: 'Select all circles with even value', matches: c => c.shape === 'circle' && ((c.value ?? 0) % 2 === 0) },
  { rule: 'Select all red cells with value > 5', matches: c => c.color === 'red' && (c.value ?? 0) > 5 },
];

export function generateColorGridQuestion(difficulty: Difficulty, id: string): ColorGridQuestion {
  const cfg = DIFF_CONFIG[difficulty];
  const { gridSize } = cfg;

  // Build rule pool and shuffle it
  let rulePool: Rule[];
  if (cfg.ruleComplexity === 'simple') rulePool = shuffle(SIMPLE_RULES);
  else if (cfg.ruleComplexity === 'medium') rulePool = shuffle([...SIMPLE_RULES, ...MEDIUM_RULES]);
  else rulePool = shuffle([...SIMPLE_RULES, ...MEDIUM_RULES, ...COMPLEX_RULES]);

  // Try each shuffled rule until we get at least 1 match — no infinite recursion
  for (let attempt = 0; attempt < 50; attempt++) {
    const cells: ColorGridCell[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, randomCell)
    );

    // Pick a different rule each attempt
    const chosenRule = rulePool[attempt % rulePool.length];
    const correctCells: [number, number][] = [];

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (chosenRule.matches(cells[r][c], r, c, cells)) {
          correctCells.push([r, c]);
        }
      }
    }

    if (correctCells.length > 0 && correctCells.length < gridSize * gridSize) {
      // Ensure not all cells or no cells match (trivial extremes)
      return { id, gridSize, cells, rule: chosenRule.rule, correctCells };
    }
  }

  // Ultimate safe fallback: generate a grid where first cell is red circle, rule = red circles
  const cells: ColorGridCell[][] = Array.from({ length: gridSize }, (_, r) =>
    Array.from({ length: gridSize }, (__, c) => {
      if (r === 0 && c === 0) return { shape: 'circle' as const, color: 'red' as const, value: 5 };
      return randomCell();
    })
  );
  return { id, gridSize, cells, rule: 'Select all red circles', correctCells: [[0, 0]] };
}

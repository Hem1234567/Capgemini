import type { GridQuestion, Difficulty, DistractionTask } from '../../types';

const DIFF_CONFIG = {
  beginner: { gridSize: 4, count: 1 },
  easy:     { gridSize: 4, count: 2 },
  medium:   { gridSize: 5, count: 3 },
  hard:     { gridSize: 6, count: 5 },
  expert:   { gridSize: 7, count: 6 },
};

// Fisher-Yates shuffle — truly random ordering every call
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateUniqueCells(gridSize: number, count: number): [number, number][] {
  const all: [number, number][] = [];
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      all.push([r, c]);
  return shuffle(all).slice(0, count);
}

// ── Vastly expanded distraction pool — 30+ diverse questions ──────────────────
const DISTRACTION_POOL: DistractionTask[] = [
  // Symmetry
  { type: 'symmetry', question: 'Is a square symmetrical?',           options: ['Yes', 'No'],             correct: 0 },
  { type: 'symmetry', question: 'Is a scalene triangle symmetrical?', options: ['Yes', 'No'],             correct: 1 },
  { type: 'symmetry', question: 'Does a circle have symmetry?',       options: ['Yes', 'No'],             correct: 0 },
  { type: 'symmetry', question: 'Does a rectangle have symmetry?',    options: ['Yes', 'No'],             correct: 0 },
  { type: 'symmetry', question: 'Is the letter H symmetrical?',       options: ['Yes', 'No'],             correct: 0 },
  { type: 'symmetry', question: 'Is the letter R symmetrical?',       options: ['Yes', 'No'],             correct: 1 },
  // Shapes
  { type: 'shapes', question: 'How many sides does a triangle have?', options: ['3', '4', '5', '6'],     correct: 0 },
  { type: 'shapes', question: 'How many sides does a hexagon have?',  options: ['5', '6', '7', '8'],     correct: 1 },
  { type: 'shapes', question: 'How many sides does a pentagon have?', options: ['4', '5', '6', '8'],     correct: 1 },
  { type: 'shapes', question: 'How many sides does an octagon have?', options: ['6', '7', '8', '9'],     correct: 2 },
  { type: 'shapes', question: 'What shape has no corners?',           options: ['Square', 'Triangle', 'Circle', 'Pentagon'], correct: 2 },
  { type: 'shapes', question: 'How many faces does a cube have?',     options: ['4', '5', '6', '8'],     correct: 2 },
  { type: 'shapes', question: 'A rhombus has how many sides?',        options: ['3', '4', '5', '6'],     correct: 1 },
  // Odd-one-out
  { type: 'odd-one-out', question: 'Odd one out: Circle, Square, Triangle, Red',      options: ['Circle', 'Square', 'Triangle', 'Red'],       correct: 3 },
  { type: 'odd-one-out', question: 'Odd one out: Star, Cube, Blue, Hexagon',          options: ['Star', 'Cube', 'Blue', 'Hexagon'],            correct: 2 },
  { type: 'odd-one-out', question: 'Odd one out: Dog, Cat, Fish, Chair',              options: ['Dog', 'Cat', 'Fish', 'Chair'],                correct: 3 },
  { type: 'odd-one-out', question: 'Odd one out: Apple, Banana, Carrot, Mango',       options: ['Apple', 'Banana', 'Carrot', 'Mango'],         correct: 2 },
  { type: 'odd-one-out', question: 'Odd one out: 2, 4, 6, 7',                         options: ['2', '4', '6', '7'],                           correct: 3 },
  { type: 'odd-one-out', question: 'Odd one out: Rose, Daisy, Oak, Tulip',            options: ['Rose', 'Daisy', 'Oak', 'Tulip'],              correct: 2 },
  // Patterns
  { type: 'shapes', question: 'Next in series: 2, 4, 8, 16, __?',    options: ['18', '20', '32', '64'],  correct: 2 },
  { type: 'shapes', question: 'Next in series: 1, 3, 6, 10, __?',    options: ['13', '14', '15', '16'],  correct: 2 },
  { type: 'shapes', question: 'Next in series: 5, 10, 15, 20, __?',  options: ['22', '24', '25', '30'],  correct: 2 },
  { type: 'shapes', question: 'Next in series: 1, 4, 9, 16, __?',    options: ['20', '24', '25', '36'],  correct: 2 },
  // Logic
  { type: 'symmetry', question: 'All squares are rectangles. True?',  options: ['True', 'False'],          correct: 0 },
  { type: 'symmetry', question: 'All rectangles are squares. True?',  options: ['True', 'False'],          correct: 1 },
  { type: 'symmetry', question: 'A triangle can have a right angle?', options: ['True', 'False'],          correct: 0 },
  { type: 'symmetry', question: 'A circle has infinite corners?',     options: ['True', 'False'],          correct: 1 },
  // Counting
  { type: 'shapes', question: 'How many corners does a star (5-pt) have?', options: ['5', '7', '10', '12'], correct: 2 },
  { type: 'shapes', question: 'Diagonals in a rectangle?',            options: ['0', '1', '2', '4'],      correct: 2 },
];

export function generateGridQuestion(difficulty: Difficulty, id: string): GridQuestion {
  const cfg = DIFF_CONFIG[difficulty];
  const cells = generateUniqueCells(cfg.gridSize, cfg.count);
  // Always pick a fresh random distraction
  const shuffledPool = shuffle(DISTRACTION_POOL);
  const distraction = shuffledPool[0];

  return {
    id,
    gridSize: cfg.gridSize,
    memoryPhase: cells,
    distractionTask: distraction,
    correctCells: cells,
  };
}

export function scoreGridAnswer(correct: [number,number][], selected: [number,number][]): { hit: number; miss: number; fp: number } {
  const correctKeys = new Set(correct.map(([r, c]) => `${r},${c}`));
  const selectedKeys = new Set(selected.map(([r, c]) => `${r},${c}`));

  let hit = 0, fp = 0;
  for (const k of selectedKeys) {
    if (correctKeys.has(k)) hit++;
    else fp++;
  }
  const miss = correctKeys.size - hit;
  return { hit, miss, fp };
}

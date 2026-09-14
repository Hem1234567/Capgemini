import type { SwitchQuestion, SwitchShape, TransformRule } from '../../types';

const SHAPES: SwitchShape['shape'][] = ['circle', 'square', 'triangle', 'star', 'diamond'];
const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const RULES: TransformRule[] = ['rotate-90', 'rotate-180', 'reflect-h', 'reflect-v', 'color-swap', 'position-swap'];

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

// Generate positions: random subset of 0-8 grid positions, no duplicates
function randomPositions(count: number): number[] {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, count);
}

function generateShapes(positions: number[]): SwitchShape[] {
  // Randomly pick colors (no repeats for adjacent shapes)
  const colorPool = shuffle(COLORS);
  return positions.map((pos, i) => ({
    shape: pick(SHAPES),
    color: colorPool[i % colorPool.length],
    position: pos,
    size: 'md' as const,
  }));
}

function applyRule(shapes: SwitchShape[], rule: TransformRule): SwitchShape[] {
  switch (rule) {
    case 'rotate-90':
      return shapes.map(s => ({ ...s, position: rotatePos90(s.position) }));
    case 'rotate-180':
      return shapes.map(s => ({ ...s, position: rotatePos90(rotatePos90(s.position)) }));
    case 'reflect-h':
      return shapes.map(s => ({ ...s, position: reflectH(s.position) }));
    case 'reflect-v':
      return shapes.map(s => ({ ...s, position: reflectV(s.position) }));
    case 'color-swap': {
      // Each shape gets a different colour from a shuffled pool — truly random
      const nextColors = shuffle(COLORS);
      return shapes.map((s, i) => ({ ...s, color: nextColors[i % nextColors.length] }));
    }
    case 'position-swap': {
      if (shapes.length < 2) return shapes;
      const swapped = [...shapes];
      // Randomly pick two distinct indices to swap
      const i = rand(swapped.length);
      let j = rand(swapped.length - 1);
      if (j >= i) j++;
      const tmp = swapped[i].position;
      swapped[i] = { ...swapped[i], position: swapped[j].position };
      swapped[j] = { ...swapped[j], position: tmp };
      return swapped;
    }
    default:
      return shapes;
  }
}

// 3x3 grid position transforms
function rotatePos90(pos: number): number {
  const row = Math.floor(pos / 3), col = pos % 3;
  return col * 3 + (2 - row);
}
function reflectH(pos: number): number {
  const row = Math.floor(pos / 3), col = pos % 3;
  return row * 3 + (2 - col);
}
function reflectV(pos: number): number {
  const row = Math.floor(pos / 3), col = pos % 3;
  return (2 - row) * 3 + col;
}

function generateWrongOptions(before: SwitchShape[], rule: TransformRule): SwitchShape[][] {
  // Pick 3 *random* wrong rules (not always the first 3)
  const wrongRules = shuffle(RULES.filter(r => r !== rule));
  return wrongRules.slice(0, 3).map(r => applyRule(before, r));
}

export function generateSwitchQuestion(difficulty: string, id: string): SwitchQuestion {
  const count =
    difficulty === 'beginner' ? 2 :
    difficulty === 'easy' ? 3 :
    difficulty === 'medium' ? 4 :
    difficulty === 'hard' ? 6 : 8;
  // Randomize positions every time
  const positions = randomPositions(count);
  const before = generateShapes(positions);
  const rule = pick(RULES);
  const after = applyRule(before, rule);

  const wrongs = generateWrongOptions(before, rule);

  // Build options array and shuffle — use index tracking to find correct answer
  const allOptions = [...wrongs, after];
  const shuffled = shuffle(allOptions);
  
  // Find correct by deep equality (reference breaks after shuffle)
  const afterJSON = JSON.stringify(after.map(s => ({ ...s })).sort((a, b) => a.position - b.position));
  const correctIdx = shuffled.findIndex(opt => {
    return JSON.stringify(opt.map(s => ({ ...s })).sort((a, b) => a.position - b.position)) === afterJSON;
  });

  return { id, rule, before, after, options: shuffled, correct: Math.max(0, correctIdx) };
}

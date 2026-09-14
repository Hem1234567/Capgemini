import type { Difficulty } from '../../types';

export type Shape = 'circle' | 'square' | 'triangle' | 'star' | 'diamond';
export type ShapeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface ShapeItem {
  shape: Shape;
  color: ShapeColor;
  count: number;
  rotation: number; // degrees
}

export interface InductiveQ {
  id: string;
  ruleDescription: string;
  exampleInputs: ShapeItem[][];
  exampleOutputs: ShapeItem[][];
  testInput: ShapeItem[];
  options: ShapeItem[][];
  correct: number;
}

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'star', 'diamond'];
const COLORS: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

// Expanded rule set — 8 rules for more variety
const RULES = [
  'rotate',
  'color-shift',
  'color-shift-back',
  'count-increase',
  'count-decrease',
  'shape-change',
  'shape-change-back',
  'reflect',
] as const;

type Rule = typeof RULES[number];

function rand(max: number) { return Math.floor(Math.random() * max); }

function pick<T>(arr: readonly T[] | T[]): T { return arr[rand(arr.length)] as T; }

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomShape(): ShapeItem {
  return { shape: pick(SHAPES), color: pick(COLORS), count: rand(3) + 1, rotation: 0 };
}

function applyInductiveRule(input: ShapeItem[], rule: Rule): ShapeItem[] {
  switch (rule) {
    case 'rotate':
      return input.map(s => ({ ...s, rotation: (s.rotation + 90) % 360 }));
    case 'reflect':
      return input.map(s => ({ ...s, rotation: (360 - s.rotation) % 360 }));
    case 'color-shift':
      return input.map(s => ({ ...s, color: COLORS[(COLORS.indexOf(s.color) + 1) % COLORS.length] }));
    case 'color-shift-back':
      return input.map(s => ({ ...s, color: COLORS[(COLORS.indexOf(s.color) - 1 + COLORS.length) % COLORS.length] }));
    case 'count-increase':
      return input.map(s => ({ ...s, count: Math.min(s.count + 1, 5) }));
    case 'count-decrease':
      return input.map(s => ({ ...s, count: Math.max(s.count - 1, 1) }));
    case 'shape-change':
      return input.map(s => ({ ...s, shape: SHAPES[(SHAPES.indexOf(s.shape) + 1) % SHAPES.length] }));
    case 'shape-change-back':
      return input.map(s => ({ ...s, shape: SHAPES[(SHAPES.indexOf(s.shape) - 1 + SHAPES.length) % SHAPES.length] }));
    default:
      return input;
  }
}

export function generateInductiveQuestion(difficulty: Difficulty, id: string): InductiveQ {
  const exampleCount =
    difficulty === 'beginner' ? 2 :
    difficulty === 'easy' ? 2 :
    difficulty === 'medium' ? 3 :
    difficulty === 'hard' ? 3 : 4;
  const shapeCount =
    difficulty === 'beginner' ? 1 :
    difficulty === 'easy' ? 2 :
    difficulty === 'medium' ? 3 :
    difficulty === 'hard' ? 4 : 5;

  // Pick a random rule
  const rule = pick(RULES);

  const exampleInputs: ShapeItem[][] = [];
  const exampleOutputs: ShapeItem[][] = [];
  for (let i = 0; i < exampleCount; i++) {
    const inp = Array.from({ length: shapeCount }, randomShape);
    exampleInputs.push(inp);
    exampleOutputs.push(applyInductiveRule(inp, rule));
  }

  const testInput = Array.from({ length: shapeCount }, randomShape);
  const correctOutput = applyInductiveRule(testInput, rule);

  // Pick 3 *random* wrong rules (not always same 3)
  const wrongRules = shuffle(RULES.filter(r => r !== rule) as Rule[]).slice(0, 3);
  const wrongOptions = wrongRules.map(r => applyInductiveRule(testInput, r));

  const allOptions = shuffle([...wrongOptions, correctOutput]);
  
  // Find correct by JSON comparison (deep equality — safe)
  const correctJSON = JSON.stringify(correctOutput);
  const correctIdx = allOptions.findIndex(o => JSON.stringify(o) === correctJSON);

  return {
    id,
    ruleDescription: rule,
    exampleInputs,
    exampleOutputs,
    testInput,
    options: allOptions,
    correct: Math.max(0, correctIdx),
  };
}

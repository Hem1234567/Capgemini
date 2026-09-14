import type { SameRuleQuestion, SwitchShape, TransformRule } from '../../types';

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

// Random unique positions on 3x3 grid
function randomPositions(count: number): number[] {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, count);
}

function randomShapes(count: number): SwitchShape[] {
  const positions = randomPositions(count);
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
      const nextColors = shuffle(COLORS);
      return shapes.map((s, i) => ({ ...s, color: nextColors[i % nextColors.length] }));
    }
    case 'position-swap': {
      if (shapes.length < 2) return shapes;
      const s = [...shapes];
      const i = rand(s.length);
      let j = rand(s.length - 1);
      if (j >= i) j++;
      const tmp = s[i].position;
      s[i] = { ...s[i], position: s[j].position };
      s[j] = { ...s[j], position: tmp };
      return s;
    }
    default: return shapes;
  }
}

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

export function generateSameRuleQuestion(difficulty: string, id: string): SameRuleQuestion {
  const count =
    difficulty === 'beginner' ? 2 :
    difficulty === 'easy' ? 3 :
    difficulty === 'medium' ? 4 :
    difficulty === 'hard' ? 6 : 8;
  const rule = pick(RULES);

  // Demonstration example
  const exBefore = randomShapes(count);
  const exAfter  = applyRule(exBefore, rule);

  // Pick 3 unique wrong rules (shuffled)
  const wrongRules = shuffle(RULES.filter(r => r !== rule) as TransformRule[]).slice(0, 3);

  // Build 4 option pairs: 3 wrong + 1 correct at a random index
  const correctIdx = rand(4);
  const optionBefores: SwitchShape[][] = [];
  const optionAfters: SwitchShape[][] = [];

  for (let i = 0; i < 4; i++) {
    const before = randomShapes(count);
    optionBefores.push(before);
    if (i === correctIdx) {
      optionAfters.push(applyRule(before, rule));
    } else {
      const wrongRule = wrongRules[i < correctIdx ? i : i - 1];
      optionAfters.push(applyRule(before, wrongRule));
    }
  }

  return {
    id,
    rule,
    exampleBefore: exBefore,
    exampleAfter: exAfter,
    options: optionBefores,
    correct: correctIdx,
    optionAfters,
  };
}

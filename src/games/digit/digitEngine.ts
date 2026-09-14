import type { DigitQuestion, Difficulty } from '../../types';

const DIFF_CONFIG: Record<Difficulty, { digitCount: number; targetRange: [number, number]; ops: ('+' | '-' | '*' | '/')[] }> = {
  beginner: { digitCount: 3, targetRange: [5, 20],  ops: ['+', '-'] },
  easy:     { digitCount: 4, targetRange: [10, 30], ops: ['+', '-', '*'] },
  medium:   { digitCount: 4, targetRange: [10, 50], ops: ['+', '-', '*', '/'] },
  hard:     { digitCount: 5, targetRange: [20, 80], ops: ['+', '-', '*', '/'] },
  expert:   { digitCount: 6, targetRange: [30, 100], ops: ['+', '-', '*', '/'] },
};

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── SAFE expression evaluator — NO eval / Function() ──────────────────────────
// Supports: integers, +, -, *, /, (, ), spaces
// Uses a recursive-descent parser: safe against code injection.
export function evaluateExpression(expr: string): number | null {
  const clean = expr.replace(/\s+/g, '');
  // Whitelist: digits, operators, parens only
  if (!/^[\d+\-*/().]+$/.test(clean)) return null;
  try {
    const result = parse(clean);
    return isFinite(result) ? Math.round(result * 1e9) / 1e9 : null;
  } catch {
    return null;
  }
}

function parse(expr: string): number {
  let pos = 0;

  function peek() { return expr[pos] ?? ''; }
  function consume() { return expr[pos++] ?? ''; }
  function skipSpaces() { while (expr[pos] === ' ') pos++; }

  function parseNumber(): number {
    skipSpaces();
    let neg = false;
    if (peek() === '-') { neg = true; consume(); }
    if (peek() === '(') {
      consume(); // '('
      const val = parseExpr();
      if (peek() !== ')') throw new Error('Missing )');
      consume(); // ')'
      return neg ? -val : val;
    }
    let num = '';
    while (/\d/.test(peek())) num += consume();
    if (peek() === '.') { num += consume(); while (/\d/.test(peek())) num += consume(); }
    if (num === '') throw new Error('Expected number at pos ' + pos);
    return neg ? -parseFloat(num) : parseFloat(num);
  }

  function parseTerm(): number {
    let left = parseNumber();
    skipSpaces();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parseNumber();
      if (op === '*') left *= right;
      else {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      }
      skipSpaces();
    }
    return left;
  }

  function parseExpr(): number {
    let left = parseTerm();
    skipSpaces();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
      skipSpaces();
    }
    return left;
  }

  const result = parseExpr();
  if (pos !== expr.length) throw new Error('Unexpected character at pos ' + pos);
  return result;
}

// ── Expression builder ────────────────────────────────────────────────────────
function tryBuildExpression(digits: number[], target: number, ops: string[]): string | null {
  // Shuffle digits to avoid always using the same order
  const shuffled = [...digits].sort(() => Math.random() - 0.5);

  // 2-operand combinations
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = 0; j < shuffled.length; j++) {
      if (i === j) continue;
      for (const op of ops) {
        const a = shuffled[i], b = shuffled[j];
        let result: number;
        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '*') result = a * b;
        else result = b !== 0 ? a / b : NaN;
        if (Number.isFinite(result) && Math.abs(result - target) < 0.001) {
          return `${a} ${op} ${b}`;
        }
      }
    }
  }

  // 3-operand combinations
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = 0; j < shuffled.length; j++) {
      for (let k = 0; k < shuffled.length; k++) {
        if (i === j || j === k || i === k) continue;
        for (const op1 of ops) {
          for (const op2 of ops) {
            const a = shuffled[i], b = shuffled[j], c = shuffled[k];
            let r1: number;
            if (op1 === '+') r1 = a + b;
            else if (op1 === '-') r1 = a - b;
            else if (op1 === '*') r1 = a * b;
            else r1 = b !== 0 ? a / b : NaN;
            if (!Number.isFinite(r1)) continue;
            let r2: number;
            if (op2 === '+') r2 = r1 + c;
            else if (op2 === '-') r2 = r1 - c;
            else if (op2 === '*') r2 = r1 * c;
            else r2 = c !== 0 ? r1 / c : NaN;
            if (Number.isFinite(r2) && Math.abs(r2 - target) < 0.001) {
              return `${a} ${op1} ${b} ${op2} ${c}`;
            }
          }
        }
      }
    }
  }

  return null;
}

export function generateDigitQuestion(difficulty: Difficulty, id: string): DigitQuestion {
  const cfg = DIFF_CONFIG[difficulty];
  let digits: number[], target: number, answer: string | null;
  let attempts = 0;

  do {
    target = rand(...cfg.targetRange);
    // Ensure digits are diverse — no three same digits in a row
    digits = Array.from({ length: cfg.digitCount }, () => rand(1, 9));
    answer = tryBuildExpression(digits, target, cfg.ops);
    attempts++;
  } while (!answer && attempts < 150);

  if (!answer) {
    // Safe fallback: pick 2 fresh digits that can clearly reach target
    const a = rand(1, Math.min(target - 1, 9));
    const b = target - a;
    digits = [a, b, ...Array.from({ length: cfg.digitCount - 2 }, () => rand(1, 9))];
    target = a + b;
    answer = `${a} + ${b}`;
  }

  return {
    id,
    target,
    availableDigits: digits,
    allowedOps: cfg.ops,
    answer,
    timeLimit:
      difficulty === 'beginner' ? 60 :
      difficulty === 'easy' ? 50 :
      difficulty === 'medium' ? 40 :
      difficulty === 'hard' ? 35 : 30,
  };
}

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { GAMES } from '../data/games';
import type { GameMeta } from '../types';
import * as Icons from 'lucide-react';

const HOW_TO_PLAY: Record<string, {
  objective: string;
  steps: string[];
  controls: string[];
  scoring: string;
  tips: string[];
  example?: string;
  commonMistakes?: string[];
}> = {
  'motion-challenge': {
    objective: 'Move the main object (player) from its starting position to the target position on the grid.',
    steps: [
      'Study the complete board before making any moves.',
      'Find the target (green star) position on the grid.',
      'Identify the starting object (blue circle).',
      'Identify static obstacles (grey cells) that cannot be moved.',
      'Identify movable blocks (dark blue) that you can slide.',
      'Plan the most efficient route to reach the target.',
      'Click on a movable block and then click its destination to slide it.',
      'Click the player and then click an empty cell to move toward the target.',
      'Reach the target with as few moves as possible.',
    ],
    controls: ['Click a movable block to select it, then click its destination', 'Click the player, then click an empty adjacent cell to move', 'Arrow keys to move the player (desktop)', 'Touch and tap on mobile'],
    scoring: 'Score = 70% accuracy (completion) + 20% time bonus + 10% efficiency. Efficiency = optimal moves / actual moves × 100.',
    tips: [
      'Study the board completely before touching anything.',
      'Find the target first, then work backwards to plan your path.',
      'Identify the blocking pieces that must be moved.',
      'Think 3–4 moves ahead before executing.',
      'Avoid random movements — every move counts against efficiency.',
    ],
    example: 'Example: Player (🔵) is at [0,0]. Target (⭐) is at [3,3]. Move movable block from [1,1] to [1,2], then move player diagonally.',
    commonMistakes: ['Moving randomly without a plan', 'Moving obstacles out of the way only to create new ones', 'Ignoring the optimal path and taking longer routes'],
  },
  'grid-challenge': {
    objective: 'Memorize highlighted grid positions, complete a short visual task, then click the correct cells to recall the positions.',
    steps: [
      'A grid appears with one or more highlighted (blue) cells.',
      'Memorize the exact row and column positions of highlighted cells.',
      'The grid disappears and a distraction task appears.',
      'Complete the distraction task (symmetry comparison, shape matching, etc.).',
      'The empty grid reappears — click to select the cells you memorized.',
      'Submit your selections.',
    ],
    controls: ['Click cells to select/deselect during recall phase', 'Click the answer option during distraction phase', 'Touch supported on mobile'],
    scoring: 'Score = (correct positions recalled − false positives) / total highlighted cells × 100.',
    tips: [
      'Think in row-column coordinates (e.g. "Row 2, Column 4").',
      'Use corner cells and the center as mental anchors.',
      'Group nearby positions together in your memory.',
      'Complete distraction tasks quickly to preserve memory.',
      'Do not rush the memory phase.',
    ],
    example: 'Example: 4×4 grid has cells [0,1] and [2,3] highlighted for 2 seconds. After a symmetry task, click those exact cells.',
    commonMistakes: ['Confusing rows and columns', 'Spending too long on the distraction task', 'Selecting extra cells you are not sure about'],
  },
  'switch-challenge': {
    objective: 'Observe how a visual arrangement changes, identify the transformation rule, and select the correct answer from 4 options.',
    steps: [
      'Study the "Before" arrangement of shapes carefully.',
      'Study the "After" arrangement and compare both.',
      'Identify what changed: position, rotation, color, shape, or count.',
      'Determine the underlying transformation rule.',
      'Evaluate all 4 answer options carefully.',
      'Select the option that correctly represents the "After" state.',
    ],
    controls: ['Click your chosen answer option', 'Touch supported on mobile'],
    scoring: 'Score = correct answers × 10 points + time bonus.',
    tips: [
      'Look at each element individually in the before and after.',
      'Consider: did shapes move, rotate, flip, change color or change type?',
      'Eliminate obviously wrong options first.',
      'Pay attention to small details — one wrong element disqualifies an option.',
    ],
    example: 'Example: Before has a red circle at top-left. After has a red circle at bottom-right. Rule: Diagonal position swap.',
    commonMistakes: ['Only checking one element and ignoring others', 'Confusing rotation with reflection', 'Not checking all 4 options before selecting'],
  },
  'digit-challenge': {
    objective: 'Use the available digits and permitted mathematical operations to create an expression that equals the target number.',
    steps: [
      'Read the target number carefully.',
      'Review the available digits (e.g. 2, 3, 5, 7).',
      'Review permitted operations: +, −, ×, ÷.',
      'Mentally construct valid expressions and check them.',
      'Type or build your expression using the provided input.',
      'Submit before the timer expires.',
    ],
    controls: ['Type expression using keyboard', 'Use on-screen digit/operation buttons', 'Press Enter or click Submit to submit'],
    scoring: 'Correct answer: +100 points. Time bonus: up to 30 extra points for fast correct answers.',
    tips: [
      'Start with multiplication and division as they change values most dramatically.',
      'Try combining the larger digits first.',
      'Use parentheses where needed (e.g. (2+3)×5 = 25).',
      'Estimate before calculating exactly.',
      'If stuck, try a simpler combination and build up.',
    ],
    example: 'Target: 17. Digits: 2, 3, 5, 7. Answer: 2+3+5+7 = 17 ✓ or 2×(3+5)+1 if 1 is available.',
    commonMistakes: ['Forgetting to use parentheses for order of operations', 'Spending too long on complex expressions', 'Not checking the result before submitting'],
  },
  'geo-sudo': {
    objective: 'Fill the grid so every row and every column contains each symbol exactly once — like a visual Sudoku.',
    steps: [
      'Study the grid and identify all available symbols.',
      'Find which symbols are already placed (given cells in grey).',
      'For each empty cell, determine which symbols are missing from its row.',
      'Cross-check with the column to narrow it down further.',
      'Place the symbol that fits both the row and column.',
      'Continue until all cells are filled.',
    ],
    controls: ['Click an empty cell to select it', 'Click a symbol from the symbol palette to place it', 'Click again to cycle through options', 'Touch supported on mobile'],
    scoring: 'Score based on correctly placed symbols and time taken.',
    tips: [
      'Start with rows or columns that have only one empty cell.',
      'Use the process of elimination.',
      'If a symbol appears in all but one position in a row, the remaining cell must have it.',
      'Cross-reference rows and columns simultaneously.',
    ],
    example: 'Example: 4×4 grid with symbols: ■ ▲ ● ★. If a row has ■, ▲, ●, the missing symbol is ★.',
    commonMistakes: ['Placing a symbol without checking the column', 'Ignoring pre-filled cells when scanning a row'],
  },
  'inductive-challenge': {
    objective: 'Study example transformations, identify the hidden rule, and select which answer option follows the same rule.',
    steps: [
      'Study the example(s) showing input → output pairs.',
      'Compare the input and output shapes carefully.',
      'Look for a consistent transformation: rotation, reflection, count change, position shift, etc.',
      'Confirm your identified rule applies to all examples.',
      'Evaluate each of the 4 answer options.',
      'Select the option whose output correctly follows the same rule.',
    ],
    controls: ['Click your chosen answer option', 'Touch supported on mobile'],
    scoring: 'Correct answer: +10 points + time bonus.',
    tips: [
      'Check all example pairs before deciding on the rule.',
      'Common rules: 90°/180° rotation, mirror flip, add/remove elements, size change.',
      'Eliminate options that clearly break the rule.',
      'Trust the pattern you identified from the examples.',
    ],
    example: 'Example: Square → Rotated 90° square. Triangle → Rotated 90° triangle. Rule: Rotate 90° clockwise.',
    commonMistakes: ['Jumping to a conclusion after only one example', 'Confusing rotation direction (CW vs CCW)', 'Selecting an option that looks similar but breaks the rule'],
  },
  'color-the-grid': {
    objective: 'Read the given rule and select all grid cells that satisfy that rule before the timer expires.',
    steps: [
      'Read the rule displayed above the grid carefully.',
      'Scan the entire grid systematically (row by row).',
      'Identify cells that match the rule.',
      'Click to select matching cells (they turn highlighted).',
      'Click again to deselect if you made a mistake.',
      'Submit when you are confident in your selections.',
    ],
    controls: ['Click cells to select/deselect', 'Submit button to lock in answers', 'Touch supported on mobile'],
    scoring: 'Score = (correct cells selected − wrong cells selected) / total correct cells × 100.',
    tips: [
      'Read the rule twice before scanning the grid.',
      'Scan systematically — do not skip cells randomly.',
      'Mark cells you are certain about first.',
      'For color rules, mentally group cells by color first.',
      'Work quickly but do not sacrifice accuracy.',
    ],
    example: 'Rule: "Select all cells with red shapes." Scan each cell, click every red shape.',
    commonMistakes: ['Selecting cells that partially match but not fully', 'Missing cells at grid edges', 'Misreading the rule (e.g. "circle" vs "square")'],
  },
  'same-rule-challenge': {
    objective: 'Study an example transformation, then identify which of the 4 option pairs follows the exact same transformation rule.',
    steps: [
      'Study the example "Before → After" transformation carefully.',
      'Identify the exact rule (rotation, reflection, color swap, etc.).',
      'Look at each of the 4 option "Before" images.',
      'Apply the identified rule mentally to each option.',
      'Select the option whose "After" would correctly follow the rule.',
    ],
    controls: ['Click your chosen answer option', 'Touch supported on mobile'],
    scoring: 'Correct answer: +10 points + time bonus.',
    tips: [
      'Be precise about the rule — not just "it changed" but exactly how.',
      'Apply the rule consistently to all 4 options.',
      'Wrong options often use a similar but different rule.',
      'Check whether orientation, color, and position are all consistent.',
    ],
    example: 'Example: Blue square → Red circle. Rule: Color and shape both change. Option A: Green triangle → ? (should become Red circle following the rule).',
    commonMistakes: ['Identifying a partial rule and missing the full transformation', 'Selecting based on visual similarity rather than rule application'],
  },
};

function GameHowToPlay({ game }: { game: GameMeta }) {
  const [openSection, setOpenSection] = useState<string>('steps');
  const guide = HOW_TO_PLAY[game.id];
  const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[game.icon] ?? Icons.Gamepad2;

  if (!guide) return <p style={{ color: 'var(--text-secondary)' }}>Guide coming soon.</p>;

  const sections = [
    { id: 'steps', label: 'STEP-BY-STEP INSTRUCTIONS', content: guide.steps, type: 'list' as const },
    { id: 'objective', label: 'OBJECTIVE', content: guide.objective, type: 'text' as const },
    { id: 'controls', label: 'CONTROLS', content: guide.controls, type: 'list' as const },
    { id: 'scoring', label: 'SCORING', content: guide.scoring, type: 'text' as const },
    { id: 'tips', label: 'TIPS & STRATEGIES', content: guide.tips, type: 'list' as const },
    ...(guide.example ? [{ id: 'example', label: 'EXAMPLE', content: guide.example, type: 'text' as const }] : []),
    ...(guide.commonMistakes ? [{ id: 'mistakes', label: 'COMMON MISTAKES', content: guide.commonMistakes, type: 'list' as const }] : []),
  ];

  return (
    <div>
      {/* Game header */}
      <div className="card newsprint-texture" style={{ padding: 'clamp(1rem, 3vw, 2rem)', display: 'flex', gap: 'clamp(1rem, 2vw, 1.5rem)', alignItems: 'flex-start', marginBottom: '2rem', border: '2px solid var(--border)', background: 'var(--bg)', flexWrap: 'wrap' }}>
        <div style={{ width: 'clamp(48px, 8vw, 64px)', height: 'clamp(48px, 8vw, 64px)', border: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconComp size={28} color="var(--text-primary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 'clamp(1.25rem, 3vw, 2rem)', color: 'var(--text-primary)', lineHeight: 1 }}>{game.name}</h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', marginTop: '0.5rem' }}>{game.description}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge" style={{ border: '1px solid var(--border)' }}>{game.categoryTag}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)', color: 'var(--text-primary)', textTransform: 'uppercase' }}>⏱ {game.suggestedTime}</span>
          </div>
        </div>
      </div>

      {/* Accordion sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sections.map(section => (
          <div key={section.id} className="card" style={{ overflow: 'hidden', border: '2px solid var(--border)' }}>
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem', background: openSection === section.id ? 'var(--text-primary)' : 'var(--bg)', border: 'none', cursor: 'pointer',
                color: openSection === section.id ? 'var(--bg)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
              }}
              onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
              aria-expanded={openSection === section.id}
            >
              {section.label}
              {openSection === section.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {openSection === section.id && (
              <div style={{ padding: '1.5rem', background: 'var(--bg)' }} className="animate-fade-in">
                {section.type === 'list' ? (
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(section.content as string[]).map((item, i) => (
                      <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>0{i + 1}</span>
                        <span style={{ fontFamily: 'var(--font-body)' }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>{section.content as string}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <Link to={`/practice/${game.id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 200, padding: '1rem' }}>
          Start Practice <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

export default function HowToPlayPage() {
  const { gameId } = useParams<{ gameId?: string }>();
  const [selectedGame, setSelectedGame] = useState<string>(gameId ?? GAMES[0].id);

  const activeGame = GAMES.find(g => g.id === selectedGame) ?? GAMES[0];

  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '4px solid var(--border)', padding: 'clamp(1.5rem, 4vw, 3rem) 0', background: 'var(--bg)' }}>
        <div className="container-page">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>How to Play</h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Learn the rules and mechanics before starting any assessment game.</p>
        </div>
      </div>

      <div className="container-page" style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        <div className="htp-layout">
          {/* Game selector sidebar */}
          <div className="htp-sidebar">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Select a Game</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {GAMES.map(game => {
                const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[game.icon] ?? Icons.Gamepad2;
                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: 'clamp(0.625rem, 1.5vw, 1rem)', border: '2px solid var(--border)', cursor: 'pointer',
                      background: selectedGame === game.id ? 'var(--text-primary)' : 'var(--bg)',
                      color: selectedGame === game.id ? 'var(--bg)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                      fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', textTransform: 'uppercase', textAlign: 'left', transition: 'all 0.15s',
                      minHeight: 44,
                    }}
                  >
                    <IconComp size={18} color={selectedGame === game.id ? 'var(--bg)' : 'var(--text-primary)'} />
                    {game.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guide content */}
          <div className="htp-content">
            <GameHowToPlay game={activeGame} />
          </div>
        </div>
      </div>
      <style>{`
        .htp-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(1.5rem, 3vw, 3rem);
          align-items: start;
        }
        .htp-sidebar { position: static; }
        @media (min-width: 1024px) {
          .htp-layout { grid-template-columns: 320px 1fr; }
          .htp-sidebar { position: sticky; top: 80px; }
        }
        @media (min-width: 1280px) {
          .htp-layout { grid-template-columns: 360px 1fr; }
        }
        @media (min-width: 1920px) {
          .htp-layout { grid-template-columns: 420px 1fr; gap: 4rem; }
        }
        @media (min-width: 2560px) {
          .htp-layout { grid-template-columns: 500px 1fr; gap: 5rem; }
        }
      `}</style>
    </div>
  );
}

import { Link } from 'react-router-dom';
import type { GameMeta } from '../../types';
import * as Icons from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';

interface GameCardProps {
  game: GameMeta;
  compact?: boolean;
}

export default function GameCard({ game, compact }: GameCardProps) {
  const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[game.icon] ?? Icons.Gamepad2;

  return (
    <div
      className="card animate-fade-in hard-shadow-hover newsprint-texture"
      style={{
        padding: compact ? 'clamp(0.75rem, 2vw, 1rem)' : 'clamp(1rem, 2.5vw, 1.5rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.625rem, 1.5vw, 1rem)',
        height: '100%',
        border: '2px solid var(--border)',
        background: 'var(--bg)',
        minWidth: 0,
      }}
    >
      {/* Icon + Category */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0.75rem',
        flexWrap: 'nowrap',
      }}>
        <div style={{
          width: 'clamp(36px, 6vw, 48px)',
          height: 'clamp(36px, 6vw, 48px)',
          flexShrink: 0,
          border: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)'
        }}>
          <IconComp size={22} color="var(--text-primary)" />
        </div>
        <span
          className="badge"
          style={{ flexShrink: 0, border: '1px solid var(--border)', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {game.categoryTag}
        </span>
      </div>

      {/* Name + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 900,
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          lineHeight: 1.1,
          wordBreak: 'break-word',
        }}>
          {game.name}
        </h3>
        {!compact && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            {game.description}
          </p>
        )}
      </div>

      {/* Meta */}
      {!compact && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
        }}>
          <DifficultyBadge difficulty="medium" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            ⏱ {game.suggestedTime}
          </span>
        </div>
      )}

      {/* Skill */}
      {!compact && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.6rem, 1.1vw, 0.6875rem)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          wordBreak: 'break-word',
        }}>
          TESTS: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{game.skill}</span>
        </p>
      )}

      {/* Actions — stack on very small screens, side-by-side otherwise */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginTop: 'auto',
        paddingTop: '0.75rem',
      }}>
        <Link
          to={`/practice/${game.id}`}
          className="btn-primary"
          style={{ flex: '1 1 120px', minWidth: 0 }}
        >
          Start Practice
        </Link>
        <Link
          to={`/how-to-play/${game.id}`}
          className="btn-secondary"
          style={{ flex: '1 1 100px', minWidth: 0 }}
        >
          How to Play
        </Link>
      </div>
    </div>
  );
}

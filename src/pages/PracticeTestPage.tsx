import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, Trophy, Brain, ArrowRight, CheckCircle } from 'lucide-react';
import { GAMES } from '../data/games';
import type { GameId } from '../types';
import * as Icons from 'lucide-react';

const MODES = [
  {
    id: 'quick',
    icon: <Zap size={24} />,
    label: 'Quick Practice',
    description: '5 questions, no time pressure. Learn the game mechanics.',
    tag: 'Recommended for beginners',
  },
  {
    id: 'standard',
    icon: <Brain size={24} />,
    label: 'Standard Practice',
    description: '10 questions with timer. Simulates a realistic practice session.',
    tag: 'Most popular',
  },
  {
    id: 'timed',
    icon: <Clock size={24} />,
    label: 'Timed Challenge',
    description: 'Full timed session at suggested assessment timings.',
    tag: 'For advanced practice',
  },
  {
    id: 'mock',
    icon: <Trophy size={24} />,
    label: 'Full Mock Assessment',
    description: 'Complete multi-game mock test combining all 4 core games.',
    tag: 'Most realistic',
    isMock: true,
  },
];

export default function PracticeTestPage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);

  const allGames = GAMES;

  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '4px solid var(--border)', padding: 'clamp(1.5rem, 4vw, 3rem) 0', background: 'var(--bg)' }}>
        <div className="container-page">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>Practice Test</h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)' }}>Choose your practice mode and game to get started.</p>
        </div>
      </div>

      <div className="container-page" style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)', paddingBottom: 'clamp(1.5rem, 3vw, 3rem)' }}>
        {/* Step 1: Select Mode */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--text-primary)', background: 'var(--text-primary)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700 }}>1</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Choose Practice Mode</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1.5rem)',
          }}>
            {MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => { setSelectedMode(mode.id); setSelectedGame(null); }}
                style={{
                  padding: '1.5rem', border: `2px solid ${selectedMode === mode.id ? 'var(--text-primary)' : 'var(--border)'}`,
                  background: selectedMode === mode.id ? 'var(--text-primary)' : 'var(--bg)',
                  color: selectedMode === mode.id ? 'var(--bg)' : 'var(--text-primary)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  boxShadow: selectedMode === mode.id ? '4px 4px 0 var(--text-primary)' : 'none',
                  transform: selectedMode === mode.id ? 'translate(-2px, -2px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ color: selectedMode === mode.id ? 'var(--bg)' : 'var(--text-primary)' }}>{mode.icon}</span>
                  {selectedMode === mode.id && <CheckCircle size={20} style={{ color: 'var(--bg)', flexShrink: 0 }} />}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.25rem' }}>{mode.label}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', lineHeight: 1.5, color: selectedMode === mode.id ? 'var(--bg)' : 'var(--text-secondary)' }}>{mode.description}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${selectedMode === mode.id ? 'var(--bg)' : 'var(--border)'}`, padding: '0.25rem 0.5rem', alignSelf: 'flex-start' }}>
                  {mode.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Game (not for mock) */}
        {selectedMode && selectedMode !== 'mock' && (
          <div style={{ marginBottom: '3rem' }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--text-primary)', background: 'var(--text-primary)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700 }}>2</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Choose a Game</h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
              gap: 'clamp(0.5rem, 1.5vw, 1rem)',
            }}>
              {allGames.map(game => {
                const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[game.icon] ?? Icons.Gamepad2;
                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      border: `2px solid ${selectedGame === game.id ? 'var(--text-primary)' : 'var(--border)'}`,
                      background: selectedGame === game.id ? 'var(--text-primary)' : 'var(--bg)',
                      color: selectedGame === game.id ? 'var(--bg)' : 'var(--text-primary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 40, height: 40, border: `2px solid ${selectedGame === game.id ? 'var(--bg)' : 'var(--border)'}`, background: selectedGame === game.id ? 'var(--text-primary)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconComp size={20} color={selectedGame === game.id ? 'var(--bg)' : 'var(--text-primary)'} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.125rem' }}>{game.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', color: selectedGame === game.id ? 'var(--bg)' : 'var(--text-secondary)', marginTop: '0.25rem' }}>{game.categoryTag}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Start */}
        {selectedMode && (selectedMode === 'mock' || selectedGame) && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--text-primary)', background: 'var(--text-primary)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700 }}>
                {selectedMode === 'mock' ? '2' : '3'}
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Ready to Start</h2>
            </div>

            <div className="card newsprint-texture" style={{ padding: '2rem', maxWidth: 600, border: '2px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mode: <strong style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{MODES.find(m => m.id === selectedMode)?.label}</strong></p>
                {selectedGame && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    Game: <strong style={{ color: 'var(--text-primary)', fontSize: '1.125rem' }}>{GAMES.find(g => g.id === selectedGame)?.name}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {selectedMode === 'mock' ? (
                  <Link
                    to={`/practice/motion-challenge?mode=mock`}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}
                  >
                    Start Mock Assessment <ArrowRight size={18} />
                  </Link>
                ) : (
                  <Link
                    to={`/practice/${selectedGame}?mode=${selectedMode}`}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '1rem' }}
                  >
                    Start {MODES.find(m => m.id === selectedMode)?.label} <ArrowRight size={18} />
                  </Link>
                )}
                <button className="btn-secondary" onClick={() => { setSelectedMode(null); setSelectedGame(null); }} style={{ padding: '1rem 2rem' }}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

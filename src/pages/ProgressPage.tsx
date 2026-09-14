import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Target, Trophy, TrendingUp, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { GAMES } from '../data/games';
import StatCard from '../components/UI/StatCard';
import DifficultyBadge from '../components/UI/DifficultyBadge';
import { formatTime } from '../utils/scoring';
import * as Icons from 'lucide-react';

function MiniLineChart({ data, color = 'var(--text-primary)' }: { data: number[]; color?: string }) {
  if (data.length < 2) {
    return <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Not enough data</p>;
  }
  const w = 200, h = 60, pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 60 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="miter" strokeLinecap="square" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return <rect key={i} x={x - 2} y={y - 2} width={4} height={4} fill={color} />;
      })}
    </svg>
  );
}

export default function ProgressPage() {
  const { store, resetProgress, isCloudSynced, syncing } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  const recentAttempts = store.attempts.slice(0, 10);
  const gameProgressList = Object.values(store.gameProgress);

  const overallBest = store.attempts.length > 0 ? Math.max(...store.attempts.map(a => a.score)) : 0;
  const overallAvg = store.attempts.length > 0
    ? Math.round(store.attempts.reduce((s, a) => s + a.score, 0) / store.attempts.length)
    : 0;
  const overallAvgAcc = store.attempts.length > 0
    ? Math.round(store.attempts.reduce((s, a) => s + a.accuracy, 0) / store.attempts.length)
    : 0;

  // Score history for chart
  const scoreHistory = store.attempts.slice(0, 20).reverse().map(a => a.score);

  const handleReset = () => {
    resetProgress();
    setConfirmReset(false);
  };

  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '4px solid var(--border)', padding: 'clamp(1.5rem, 4vw, 3rem) 0', background: 'var(--bg)' }}>
        <div className="container-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>My Progress</h1>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Track your improvement across all cognitive games.</p>
            <Link
              to="/account"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isCloudSynced ? 'var(--accent)' : 'var(--text-secondary)', textDecoration: 'none' }}
            >
              {isCloudSynced
                ? <><Cloud size={14} /> {syncing ? 'Syncing…' : 'Synced to your account'}</>
                : <><CloudOff size={14} /> Saved to this browser only — sign in to sync</>}
            </Link>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8125rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}
            onClick={() => setConfirmReset(true)}
          >
            <RefreshCw size={14} /> Reset Progress
          </button>
        </div>
      </div>

      {/* Reset confirm modal */}
      {confirmReset && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ padding: '2rem', border: '4px solid var(--border)', borderRadius: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Reset All Progress?</h2>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
              This will permanently delete all your attempt history, scores and progress data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ background: 'var(--accent)', flex: 1, justifyContent: 'center' }} onClick={handleReset}>
                Yes, Reset Everything
              </button>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container-page" style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)', paddingBottom: 'clamp(1.5rem, 3vw, 3rem)' }}>
        {store.attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '2px solid var(--border)', background: 'var(--bg)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>No progress yet</h2>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>Complete a game to start tracking your progress here.</p>
            <Link to="/practice" className="btn-primary">Start Practicing</Link>
          </div>
        ) : (
          <>
            {/* Overall stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))',
              gap: 'clamp(0.75rem, 2vw, 1.5rem)',
              marginBottom: '3rem',
            }}>
              <StatCard icon={<BarChart2 size={24} />} label="Total Attempts" value={store.totalAttempts} />
              <StatCard icon={<Trophy size={24} />} label="Best Score" value={overallBest} accent />
              <StatCard icon={<Target size={24} />} label="Avg Score" value={overallAvg} />
              <StatCard icon={<TrendingUp size={24} />} label="Avg Accuracy" value={`${overallAvgAcc}%`} />
            </div>

            {/* Score chart */}
            <div className="card newsprint-texture" style={{ padding: '2rem', marginBottom: '3rem', border: '2px solid var(--border)', background: 'var(--bg)' }}>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Score Progression (Last 20 attempts)</h2>
              {scoreHistory.length >= 2 ? (
                <MiniLineChart data={scoreHistory} />
              ) : (
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Play at least 2 games to see progression.</p>
              )}
            </div>

            {/* Per-game progress */}
            {gameProgressList.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Game-wise Performance</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                  gap: 'clamp(0.75rem, 2vw, 1.5rem)',
                }}>
                  {gameProgressList.map(gp => {
                    const meta = GAMES.find(g => g.id === gp.gameId);
                    if (!meta) return null;
                    const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[meta.icon] ?? Icons.Gamepad2;
                    return (
                      <div key={gp.gameId} className="card" style={{ padding: '1.5rem', border: '2px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                          <div style={{ width: 48, height: 48, border: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconComp size={24} color="var(--text-primary)" />
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{meta.name}</div>
                            <DifficultyBadge difficulty={gp.currentDifficulty} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Attempts</span><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{gp.attempts}</div></div>
                          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Best Score</span><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{gp.bestScore}</div></div>
                          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Avg Score</span><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{gp.avgScore}</div></div>
                          <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Avg Acc.</span><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{gp.avgAccuracy}%</div></div>
                        </div>
                        <Link to={`/practice/${gp.gameId}`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
                          Practice Again
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent attempts */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Recent Attempts</h2>
              <div style={{ overflowX: 'auto', border: '2px solid var(--border)', background: 'var(--bg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--text-primary)' }}>
                      {['Game', 'Difficulty', 'Score', 'Accuracy', 'Time', 'Date'].map(h => (
                        <th key={h} style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', padding: '1rem', color: 'var(--bg)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.map((attempt) => (
                      <tr key={attempt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{attempt.gameName}</td>
                        <td style={{ padding: '1rem' }}><DifficultyBadge difficulty={attempt.difficulty} /></td>
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{attempt.score}</td>
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{attempt.accuracy}%</td>
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatTime(attempt.timeTaken)}</td>
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(attempt.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, ShieldCheck, Gamepad2, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminStats } from '../../lib/adminApi';

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <Icon size={15} style={{ color: accent ? 'var(--accent)' : 'var(--text-secondary)' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
        {value}
      </span>
    </div>
  );
}

function SignupsChart({ signupsByDay }: { signupsByDay: Record<string, number> }) {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  const values = days.map((d) => signupsByDay[d] ?? 0);
  const max = Math.max(1, ...values);

  return (
    <div className="card" style={{ padding: '1.125rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        New signups — last 14 days
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 120 }}>
        {values.map((v, i) => (
          <div key={days[i]} title={`${days[i]}: ${v}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 22,
                height: `${(v / max) * 100}%`,
                minHeight: v > 0 ? 3 : 1,
                background: v > 0 ? 'var(--accent)' : 'var(--border)',
                borderRadius: '2px 2px 0 0',
                opacity: v > 0 ? 1 : 0.3,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
        <span>{days[0].slice(5)}</span>
        <span>{days[days.length - 1].slice(5)}</span>
      </div>
    </div>
  );
}

function GameBreakdown({ rows }: { rows: AdminStats['gameBreakdown'] }) {
  const sorted = [...rows].sort((a, b) => b.attempts - a.attempts);
  const max = Math.max(1, ...sorted.map((r) => r.attempts));

  return (
    <div className="card" style={{ padding: '1.125rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Attempts by game
      </h3>
      {sorted.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>No attempts recorded yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {sorted.map((row) => (
          <div key={row.gameName}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.gameName}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{row.attempts} attempts · {row.avgAccuracy}% avg accuracy</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', opacity: 0.25, borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${(row.attempts / max) * 100}%`, background: 'var(--accent)', borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .stats()
      .then((s) => !cancelled && setStats(s))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={16} className="animate-spin" /> Loading stats…
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: '1rem', border: '1px solid var(--accent)', background: 'var(--accent-light)', display: 'flex', gap: '0.5rem' }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{error}</p>
        </div>
      )}

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard icon={Users} label="Total users" value={stats.totalUsers} accent />
            <StatCard icon={UserCheck} label="Active today" value={stats.activeToday} />
            <StatCard icon={TrendingUp} label="Active this week" value={stats.activeWeek} />
            <StatCard icon={UserX} label="Suspended" value={stats.suspended} />
            <StatCard icon={ShieldCheck} label="Admins" value={stats.admins} />
            <StatCard icon={Gamepad2} label="Total game attempts" value={stats.totalAttempts} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <SignupsChart signupsByDay={stats.signupsByDay} />
            <GameBreakdown rows={stats.gameBreakdown} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}

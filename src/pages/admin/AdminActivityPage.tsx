import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminActivityRow } from '../../lib/adminApi';

export default function AdminActivityPage() {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    adminApi
      .recentActivity(100)
      .then((res) => setRows(res.activity))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // Light polling keeps this "live enough" without needing websockets —
    // cheap because it's one indexed query, not a full table scan.
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout title="Recent Activity">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button onClick={load} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: '0.75rem 1rem', border: '1px solid var(--accent)', background: 'var(--accent-light)', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>User</th>
              <th style={{ padding: '0.75rem 1rem' }}>Game</th>
              <th style={{ padding: '0.75rem 1rem' }}>Difficulty</th>
              <th style={{ padding: '0.75rem 1rem' }}>Mode</th>
              <th style={{ padding: '0.75rem 1rem' }}>Score</th>
              <th style={{ padding: '0.75rem 1rem' }}>Accuracy</th>
              <th style={{ padding: '0.75rem 1rem' }}>When</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Loader2 size={16} className="animate-spin" style={{ verticalAlign: '-3px', marginRight: 6 }} />
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No activity yet.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.email}</td>
                  <td style={{ padding: '0.625rem 1rem' }}>{row.game_name}</td>
                  <td style={{ padding: '0.625rem 1rem', textTransform: 'capitalize' }}>{row.difficulty}</td>
                  <td style={{ padding: '0.625rem 1rem', textTransform: 'capitalize' }}>{row.mode}</td>
                  <td style={{ padding: '0.625rem 1rem' }}>{row.score}</td>
                  <td style={{ padding: '0.625rem 1rem' }}>{row.accuracy}%</td>
                  <td style={{ padding: '0.625rem 1rem', color: 'var(--text-secondary)' }}>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

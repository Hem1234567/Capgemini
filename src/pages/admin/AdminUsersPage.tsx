import { useEffect, useState, useCallback } from 'react';
import { Search, ShieldCheck, ShieldOff, Ban, CheckCircle2, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi, type AdminUserRow } from '../../lib/adminApi';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 20;

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .listUsers(page, PAGE_SIZE, search)
      .then((res) => {
        setRows(res.users);
        setTotal(res.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function withBusy(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="Users">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            placeholder="Search by email…"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderRadius: 4,
              fontSize: '0.8125rem',
            }}
          />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{total} total users</span>
      </div>

      {error && (
        <div className="card" style={{ padding: '0.75rem 1rem', border: '1px solid var(--accent)', background: 'var(--accent-light)', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Attempts</th>
              <th style={{ padding: '0.75rem 1rem' }}>Joined</th>
              <th style={{ padding: '0.75rem 1rem' }}>Last active</th>
              <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Loader2 size={16} className="animate-spin" style={{ verticalAlign: '-3px', marginRight: 6 }} />
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No users found.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.email} {isSelf && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(you)</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                      {u.full_name || u.department ? (
                        <>
                          {u.full_name || '—'}
                          {u.department && <span style={{ display: 'block', fontSize: '0.6875rem' }}>{u.department}</span>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {u.role === 'admin' ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ color: u.status === 'suspended' ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 600 }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{u.attemptCount}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{relativeTime(u.last_seen_at)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <button
                          disabled={isSelf || busyId === u.id}
                          onClick={() => withBusy(u.id, () => adminApi.setRole(u.id, u.role === 'admin' ? 'user' : 'admin'))}
                          className="btn-ghost"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.6875rem', opacity: isSelf ? 0.4 : 1 }}
                          title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                        >
                          {u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                        </button>
                        <button
                          disabled={isSelf || busyId === u.id}
                          onClick={() => withBusy(u.id, () => adminApi.setStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended'))}
                          className="btn-ghost"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.6875rem', opacity: isSelf ? 0.4 : 1 }}
                          title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        >
                          {u.status === 'suspended' ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                        </button>
                        <button
                          disabled={isSelf || busyId === u.id}
                          onClick={() => setConfirmDelete(u)}
                          className="btn-ghost"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.6875rem', color: 'var(--accent)', opacity: isSelf ? 0.4 : 1 }}
                          title="Delete user"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <button className="btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
          <ChevronLeft size={14} /> Prev
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Page {page + 1} of {totalPages}
        </span>
        <button className="btn-ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
          Next <ChevronRight size={14} />
        </button>
      </div>

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}
          onClick={() => setConfirmDelete(null)}
        >
          <div className="card" style={{ maxWidth: 380, width: '100%', padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Delete this user?</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              This permanently deletes <strong>{confirmDelete.email}</strong> and all of their game history. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)} style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem', background: 'var(--accent)' }}
                onClick={() => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  withBusy(target.id, () => adminApi.deleteUser(target.id));
                }}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

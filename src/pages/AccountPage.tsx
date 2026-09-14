import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, CloudOff, LogOut, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import ProfileEditor from '../components/Account/ProfileEditor';

type Mode = 'sign-in' | 'sign-up';

export default function AccountPage() {
  const { user, cloudEnabled, signIn, signUp, signOut } = useAuth();
  const { store, syncing } = useProgress();

  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const result = mode === 'sign-up' ? await signUp(email, password) : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    } else if (result.needsEmailConfirmation) {
      setInfo('Account created — check your inbox to confirm your email, then sign in.');
      setMode('sign-in');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 0', marginBottom: '2rem' }}>
        <div className="container-page">
          <h1 style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--text-primary)' }}>My Account</h1>
        </div>
      </div>

      <div className="container-page" style={{ maxWidth: 480 }}>
        {!cloudEnabled && (
          <div className="card" style={{ padding: '1.125rem', marginBottom: '1.5rem', background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              <CloudOff size={16} style={{ verticalAlign: '-2px', marginRight: '0.375rem' }} />
              Cloud sync isn't configured yet
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your progress is currently saved only in this browser. To access it from any device, set up
              a free Supabase project and add the keys to <code>.env</code> — see <code>README.md</code> for
              step-by-step instructions.
            </p>
          </div>
        )}

        {cloudEnabled && user ? (
          <>
          <ProfileEditor />
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {syncing ? <Loader2 size={20} className="spin" color="var(--accent)" /> : <Cloud size={20} color="var(--accent)" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {syncing ? 'Syncing…' : 'Synced to the cloud'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{store.totalAttempts}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attempts saved</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{Object.keys(store.gameProgress).length}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Games tracked</div>
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Sign in with this same account on any device to pick up right where you left off.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/progress" className="btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 140 }}>
                View Progress
              </Link>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', minWidth: 140 }} onClick={() => signOut()}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
          </>
        ) : (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                className={mode === 'sign-in' ? 'badge' : 'filter-chip'}
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}
                onClick={() => { setMode('sign-in'); setError(null); setInfo(null); }}
                disabled={!cloudEnabled}
              >
                Sign In
              </button>
              <button
                className={mode === 'sign-up' ? 'badge' : 'filter-chip'}
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}
                onClick={() => { setMode('sign-up'); setError(null); setInfo(null); }}
                disabled={!cloudEnabled}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Email
                <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="email"
                    required
                    disabled={!cloudEnabled || submitting}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem' }}
                  />
                </div>
              </label>

              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Password
                <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    disabled={!cloudEnabled || submitting}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-field"
                    style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem' }}
                  />
                </div>
              </label>

              {error && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--red)', fontWeight: 600 }}>{error}</p>
              )}
              {info && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle size={15} /> {info}
                </p>
              )}

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={!cloudEnabled || submitting}>
                {submitting ? <Loader2 size={16} className="spin" /> : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.6 }}>
              Signing in syncs your practice history and difficulty progress to the cloud so it follows
              you across every device. Anything you've already played on this browser will be uploaded
              automatically the first time you sign in.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

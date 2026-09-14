import type { ReactNode } from 'react';

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div className="stat-card" style={{ 
      border: '2px solid var(--border)', 
      background: accent ? 'var(--text-primary)' : 'var(--bg)',
      color: accent ? 'var(--bg)' : 'var(--text-primary)'
    }}>
      {icon && (
        <div style={{
          width: 40, height: 40,
          border: '2px solid',
          borderColor: accent ? 'var(--bg)' : 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <span style={{ color: accent ? 'var(--bg)' : 'var(--text-primary)' }}>{icon}</span>
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', marginTop: '0.25rem', textTransform: 'uppercase', color: accent ? 'rgba(249, 249, 247, 0.7)' : 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

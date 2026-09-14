import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ShieldCheck } from 'lucide-react';

const TABS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
];

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="bg-page" style={{ paddingBottom: '3rem', minHeight: '70vh' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 0', marginBottom: '1.5rem' }}>
        <div className="container-page" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--text-primary)' }}>{title}</h1>
        </div>
      </div>

      <div className="container-page">
        <nav
          aria-label="Admin navigation"
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.25rem',
          }}
        >
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}

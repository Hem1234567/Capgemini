import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Brain, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links: { to: string; label: string; end?: boolean }[];
}

export default function MobileNav({ open, onClose, links }: MobileNavProps) {
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="mobile-nav-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — fluid width: min 280px, max 360px or 88vw */}
      <nav
        className="mobile-nav-drawer"
        aria-label="Mobile navigation"
        style={{ width: 'min(360px, 88vw)' }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(0.75rem, 2vw, 1rem)',
          borderBottom: '2px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: 30,
              height: 30,
              background: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Brain size={16} color="var(--bg)" />
            </span>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: 'var(--text-primary)',
            }}>
              Cognitive Games
            </span>
          </div>

          {/* Theme toggle + Close button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              className="btn-ghost"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="btn-ghost"
              onClick={onClose}
              aria-label="Close navigation menu"
              style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Nav links — 48px min height per item for touch */}
        <div style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                minHeight: 48,
                padding: '0.625rem clamp(0.75rem, 2vw, 1rem)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(0.8125rem, 2vw, 0.9375rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--bg)' : 'var(--text-primary)',
                background: isActive ? 'var(--text-primary)' : 'transparent',
                textDecoration: 'none',
                marginBottom: '0.25rem',
                transition: 'all 0.15s',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

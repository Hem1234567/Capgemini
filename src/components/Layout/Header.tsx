import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Sun, Moon, Cloud, User } from 'lucide-react';
import MobileNav from './MobileNav';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/games', label: 'All Games' },
  { to: '/how-to-play', label: 'How to Play' },
  { to: '/practice', label: 'Practice Test' },
  { to: '/progress', label: 'My Progress' },
  { to: '/account', label: 'Account' },
  { to: '/about', label: 'About' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, cloudEnabled, isAdmin } = useAuth();
  const [now, setNow] = useState(new Date());
  const navLinks = isAdmin ? [...NAV_LINKS, { to: '/admin', label: 'Admin' }] : NAV_LINKS;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>
      <header className="header" style={{ borderBottom: '2px solid var(--border)' }}>
        {/* Top Edition Bar */}
        <div
          className="container-page edition-bar"
          style={{
            borderBottom: '1px solid var(--border)',
            padding: '0.25rem 0',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.5625rem, 1vw, 0.6875rem)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ flexShrink: 0 }}>Vol. I — No. 1</span>
          <span className="hide-mobile" style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {today}&nbsp;&nbsp;—&nbsp;&nbsp;{time}
          </span>
          <span style={{ flexShrink: 0 }}>Practice Edition</span>
        </div>

        {/* Main header row */}
        <div
          className="container-page"
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 'clamp(56px, 8vw, 80px)',
            gap: 'clamp(0.75rem, 2vw, 1.5rem)',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            aria-label="Cognitive Games Practice Hub — Home"
          >
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
              The Cognitive Games
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 1.5vw, 1rem)',
              flex: 1,
              marginLeft: 'auto',
              justifyContent: 'flex-end',
              flexWrap: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  padding: '0.25rem 0',
                  fontSize: 'clamp(0.625rem, 1vw, 0.75rem)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop: Theme toggle + Mobile hamburger */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto', flexShrink: 0 }}
          >
            {/* Theme toggle — visible on all sizes */}
            <button
              id="theme-toggle-btn"
              className="btn-ghost"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{ minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark'
                ? <Sun size={20} />
                : <Moon size={20} />}
            </button>

            {/* Account / cloud sync status — visible on all sizes */}
            <Link
              to="/account"
              className="btn-ghost"
              aria-label={user ? 'Account — synced' : 'Sign in'}
              title={user ? `Signed in as ${user.email} — synced across devices` : cloudEnabled ? 'Sign in to sync progress' : 'Account'}
              style={{ minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: user ? 'var(--accent)' : undefined }}
            >
              {user ? <Cloud size={20} /> : <User size={20} />}
            </Link>

            {/* Mobile hamburger — hidden on desktop */}
            <div className="mobile-menu-container" style={{ display: 'flex', alignItems: 'center' }}>
              <button
                id="mobile-menu-btn"
                className="btn-ghost mobile-menu-btn"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
      />

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-menu-container { display: none !important; }
        .hide-mobile { display: block; }

        /* Show hamburger on tablets and below */
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-container { display: flex !important; }
          .hide-mobile { display: none; }
        }

        /* On large TVs / projectors, bump up the nav link size */
        @media (min-width: 1920px) {
          .desktop-nav a { font-size: 0.875rem !important; }
          .header { border-bottom-width: 3px; }
        }
        @media (min-width: 2560px) {
          .desktop-nav a { font-size: 1.0625rem !important; }
        }
      `}</style>
    </>
  );
}

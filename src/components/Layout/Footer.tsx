import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ borderTop: '4px solid var(--border)', background: 'var(--bg)', marginTop: 'auto' }}>
      <div className="container-page" style={{ padding: '0' }}>
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-col footer-col-brand">
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
                The Cognitive Games
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(0.6875rem, 1vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', lineHeight: 1.6, maxWidth: 220 }}>
              Practice. Improve. Perform.
            </p>
          </div>

          {/* Platform */}
          <div className="footer-col">
            <h3 className="footer-heading">Platform</h3>
            <FooterLinks links={[
              { to: '/', label: 'Home' },
              { to: '/about', label: 'About' },
              { to: '/progress', label: 'My Progress' },
            ]} />
          </div>

          {/* Games */}
          <div className="footer-col">
            <h3 className="footer-heading">Games</h3>
            <FooterLinks links={[
              { to: '/games', label: 'All Games' },
              { to: '/how-to-play', label: 'How to Play' },
              { to: '/practice/motion-challenge', label: 'Motion Challenge' },
              { to: '/practice/grid-challenge', label: 'Grid Challenge' },
            ]} />
          </div>

          {/* Practice */}
          <div className="footer-col">
            <h3 className="footer-heading">Practice</h3>
            <FooterLinks links={[
              { to: '/practice', label: 'Practice Test' },
              { to: '/practice', label: 'Quick Practice' },
              { to: '/practice', label: 'Mock Assessment' },
            ]} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="footer-disclaimer" style={{ borderTop: '4px solid var(--border)', padding: 'clamp(1rem, 2vw, 1.25rem) clamp(0.75rem, 2vw, 1rem)', background: '#E5E5E0' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.625rem, 1vw, 0.75rem)', color: 'var(--text-primary)', lineHeight: 1.7, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>NOTICE:</span> <strong>INDEPENDENT PRACTICE PLATFORM.</strong> This platform contains Capgemini-style cognitive games for practice purposes. It is <strong>NOT affiliated with, endorsed by, or officially connected to Capgemini SE</strong>. Actual assessment formats, game types, scoring, timings and interfaces may differ. All practice content is independently created.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.5625rem, 0.9vw, 0.75rem)', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.75rem' }}>
            © {new Date().getFullYear()} Cognitive Games Practice Hub. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        /* Footer grid: 1 col on mobile → 4 cols on tablet+ */
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        .footer-col {
          padding: clamp(1.25rem, 3vw, 2.5rem) clamp(0.75rem, 2vw, 1rem);
          border-bottom: 1px solid var(--border);
        }
        .footer-col:last-child {
          border-bottom: none;
        }
        .footer-heading {
          font-family: var(--font-mono);
          font-size: clamp(0.6875rem, 1vw, 0.8125rem);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--border);
          padding-bottom: 0.5rem;
          display: inline-block;
        }

        @media (min-width: 640px) {
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-col {
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
          }
          .footer-col:nth-child(2n) { border-right: none; }
          .footer-col:nth-last-child(-n+2) { border-bottom: none; }
        }
        @media (min-width: 1024px) {
          .footer-grid { grid-template-columns: repeat(4, 1fr); }
          .footer-col { border-bottom: none; border-right: 1px solid var(--border); }
          .footer-col:last-child { border-right: none; }
        }
        @media (min-width: 1920px) {
          .footer-col { padding: 3rem 2rem; }
          .footer-heading { font-size: 0.9375rem; }
        }
        @media (min-width: 2560px) {
          .footer-col { padding: 4rem 2.5rem; }
          .footer-heading { font-size: 1.0625rem; }
        }
      `}</style>
    </footer>
  );
}

function FooterLinks({ links }: { links: { to: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {links.map(link => (
        <Link
          key={link.label}
          to={link.to}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(0.75rem, 1vw, 0.8125rem)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s', textTransform: 'uppercase' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import NoticeBanner from '../components/UI/NoticeBanner';
import GameCard from '../components/UI/GameCard';
import { GAMES } from '../data/games';

const FEATURED_GAME_IDS = ['motion-challenge', 'grid-challenge', 'switch-challenge', 'digit-challenge'];
const featuredGames = GAMES.filter(g => FEATURED_GAME_IDS.includes(g.id));

export default function HomePage() {
  return (
    <div className="bg-page">
      {/* Ticker */}
      <div style={{ borderBottom: '2px solid var(--border)', background: 'var(--text-primary)', color: 'var(--bg)', overflow: 'hidden', padding: '0.5rem 0' }}>
        <div className="marquee" style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span>LATEST UPDATES: 8 NEW COGNITIVE GAMES ADDED • PRACTICE TEST MODE NOW AVAILABLE • DETAILED PROGRESS TRACKING ACTIVATED • INDEPENDENT PRACTICE PLATFORM — NOT AFFILIATED WITH CAPGEMINI SE • </span>
          <span>LATEST UPDATES: 8 NEW COGNITIVE GAMES ADDED • PRACTICE TEST MODE NOW AVAILABLE • DETAILED PROGRESS TRACKING ACTIVATED • INDEPENDENT PRACTICE PLATFORM — NOT AFFILIATED WITH CAPGEMINI SE • </span>
        </div>
      </div>

      <style>{`
        .marquee {
          display: inline-block;
          animation: scroll 20s linear infinite;
        }
        .marquee span { padding-right: 2rem; }
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Hero two-column layout */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 8fr 4fr;
          }
          .hero-left { border-bottom: none !important; border-right: 2px solid var(--border); }
        }

        /* Info columns */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .info-grid { grid-template-columns: repeat(3, 1fr); }
          .info-col { border-right: 2px solid var(--border); }
          .info-col:last-child { border-right: none; }
        }
        @media (max-width: 767px) {
          .info-col { border-right: none !important; border-bottom: 2px solid var(--border); }
          .info-col:last-child { border-bottom: none; }
        }

        /* Featured games grid */
        .featured-grid {
          display: grid;
          gap: clamp(1rem, 2vw, 1.5rem);
          grid-template-columns: 1fr;
        }
        @media (min-width: 480px)  { .featured-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 900px)  { .featured-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1920px) { .featured-grid { grid-template-columns: repeat(4, 1fr); gap: 2rem; } }
        @media (min-width: 2560px) { .featured-grid { grid-template-columns: repeat(4, 1fr); gap: 2.5rem; } }
      `}</style>

      {/* Notice */}
      <div className="container-page" style={{ padding: 'clamp(0.5rem, 1.5vw, 1rem) clamp(1rem, 3vw, 2rem)' }}>
        <NoticeBanner compact />
      </div>

      {/* Hero: Asymmetric Grid */}
      <section style={{ borderTop: '2px solid var(--border)', borderBottom: '4px solid var(--border)' }}>
        <div className="hero-grid">
          {/* Left Col */}
          <div
            className="hero-left"
            style={{
              padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2.5rem)',
              borderBottom: '2px solid var(--border)',
            }}
          >
            <div className="badge" style={{ marginBottom: '1.5rem', background: 'var(--text-primary)', color: 'var(--bg)' }}>
              THE DEFINITIVE GUIDE
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.25rem, 7vw, 5.5rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1,
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}>
              Master the Cognitive Assessment.
            </h1>

            <div style={{ display: 'flex', gap: 'clamp(0.5rem, 1.5vw, 1rem)', marginTop: '2rem', flexWrap: 'wrap' }}>
              <Link to="/practice" className="btn-primary" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: 'clamp(0.75rem, 1.5vw, 1rem) clamp(1.25rem, 2.5vw, 2rem)' }}>
                Start Practicing <ArrowRight size={18} />
              </Link>
              <Link to="/games" className="btn-secondary" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)', padding: 'clamp(0.75rem, 1.5vw, 1rem) clamp(1.25rem, 2.5vw, 2rem)' }}>
                View Syllabus
              </Link>
            </div>
          </div>

          {/* Right Col */}
          <div style={{ padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 1.5rem)', background: 'var(--bg)' }}>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1.5rem',
              borderBottom: '2px solid var(--border)',
              paddingBottom: '0.5rem',
            }}>
              Executive Summary
            </h2>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)', lineHeight: 1.8, color: 'var(--text-primary)' }}>
              <span style={{
                float: 'left',
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                lineHeight: 0.8,
                fontWeight: 900,
                marginRight: '0.75rem',
                color: 'var(--text-primary)',
              }}>B</span>
              uild your planning, memory, spatial reasoning, logical thinking and attention skills through interactive practice games. This platform is designed specifically to prepare you for Capgemini-style assessments through rigorous, timed simulations. No registration required.
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section style={{ padding: 'clamp(2rem, 6vw, 4rem) 0', background: 'var(--bg)' }}>
        <div className="container-page">
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 'clamp(1rem, 3vw, 2rem)',
            borderBottom: '4px solid var(--border)',
            paddingBottom: '1rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>Featured Games</h2>
              <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)', textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '0.05em' }}>Required syllabus for placement preparation</p>
            </div>
            <Link to="/games" className="btn-secondary">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="featured-grid">
            {featuredGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>

      {/* Info Sections Grid */}
      <section style={{ borderTop: '4px solid var(--border)', borderBottom: '2px solid var(--border)' }}>
        <div className="info-grid">
          {[
            {
              id: '01',
              title: 'What Are Cognitive Assessments?',
              body: 'Interactive assessments designed to measure abilities such as planning, memory, attention, logical reasoning and pattern recognition. Companies use game-based formats to evaluate candidates holistically beyond standard technical tests.',
            },
            {
              id: '02',
              title: 'Why Practice With Games?',
              body: 'Game-based practice helps you become familiar with the interaction style, improve speed and accuracy, and reduce hesitation during timed assessments. Regular practice builds confidence and performance under pressure.',
            },
            {
              id: '03',
              title: 'Choose Your Challenge',
              body: 'Select a game, learn how it works through our comprehensive "How to Play" guide and start practicing immediately. Track your progress, review mistakes and level up your difficulty as you improve over time.',
            },
          ].map((section) => (
            <div
              key={section.title}
              className="info-col"
              style={{ padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)' }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--border)', marginBottom: '1rem', opacity: 0.5 }}>{section.id}</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)', lineHeight: 1.1 }}>{section.title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(2.5rem, 7vw, 5rem) 0', textAlign: 'center', background: 'var(--text-primary)', color: 'var(--bg)' }}>
        <div className="container-page">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1 }}>Ready to Start Practicing?</h2>
          <p style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2.5rem', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', maxWidth: 600, margin: '0 auto 2.5rem', color: 'rgba(249,249,247,0.7)' }}>
            No sign-up required. Practice any game, track your progress and improve your cognitive assessment performance.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/practice" className="btn-primary" style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: 'none' }}>
              Start Practicing Now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

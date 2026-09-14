import { Link } from 'react-router-dom';
import { Brain, ShieldCheck, Info, BookOpen } from 'lucide-react';
import NoticeBanner from '../components/UI/NoticeBanner';

export default function AboutPage() {
  return (
    <div className="bg-page" style={{ paddingBottom: '3rem' }}>
      <div style={{ borderBottom: '4px solid var(--border)', padding: 'clamp(1.5rem, 4vw, 3rem) 0', background: 'var(--bg)' }}>
        <div className="container-page">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>About This Platform</h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Learn about the Cognitive Games Practice Hub and our mission.</p>
        </div>
      </div>

      <div className="container-page" style={{ paddingTop: 'clamp(1.5rem, 3vw, 2.5rem)', paddingBottom: 'clamp(1.5rem, 3vw, 3rem)', maxWidth: 'min(800px, 100%)' }}>
        {/* Notice */}
        <div style={{ marginBottom: '3rem' }}>
          <NoticeBanner />
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          <Section
            icon={<Brain size={24} />}
            title="What Is This Platform?"
          >
            <p>The <strong>Cognitive Games Practice Hub</strong> is an independent, free practice platform built to help students prepare for cognitive and game-based assessments used by companies like Capgemini in their hiring process.</p>
            <p>Our platform provides interactive simulations of cognitive games that test abilities including planning, working memory, spatial attention, pattern recognition, numerical reasoning and logical deduction.</p>
          </Section>

          <Section
            icon={<BookOpen size={24} />}
            title="Our Mission"
          >
            <p>We believe every student deserves access to high-quality practice resources regardless of their background or institution. Our goal is to make cognitive assessment preparation accessible, interactive and effective.</p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyleType: 'square' }}>
              <li>Provide realistic game-based practice for placement candidates</li>
              <li>Help students reduce hesitation and improve speed under pressure</li>
              <li>Enable unlimited practice without login or fees</li>
              <li>Track progress and identify areas for improvement</li>
            </ul>
          </Section>

          <Section
            icon={<ShieldCheck size={24} />}
            title="Important Disclaimer"
          >
            <div className="card newsprint-texture" style={{ padding: '1.5rem', border: '2px solid var(--text-primary)', background: 'var(--bg)' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>⚠️ This is an independent practice platform. It is NOT affiliated with, endorsed by, or officially connected to Capgemini SE or any of its subsidiaries.</p>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', listStyleType: 'square' }}>
                <li>All practice content is independently created for educational purposes.</li>
                <li>Actual Capgemini assessment formats, game types, questions, scoring, timings and interfaces may differ from what is shown here.</li>
                <li>Assessment content may change between hiring drives and locations.</li>
                <li>We do not guarantee that identical games, questions or mechanics will appear in any actual Capgemini assessment.</li>
                <li>This platform does not collect or store any personal data on external servers.</li>
              </ul>
            </div>
          </Section>

          <Section
            icon={<Info size={24} />}
            title="How to Use This Platform"
          >
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>Explore All Games</strong> — Visit the All Games page to see all 8 cognitive game types.</li>
              <li><strong>Learn How to Play</strong> — Read the detailed How to Play guide for each game before practicing.</li>
              <li><strong>Practice at Your Level</strong> — Start with Beginner or Easy mode and progress to higher difficulties.</li>
              <li><strong>Track Your Progress</strong> — Review your scores, accuracy and improvement over time.</li>
              <li><strong>Take the Mock Assessment</strong> — Simulate a multi-game cognitive assessment under timed conditions.</li>
            </ol>
          </Section>
        </div>

        {/* CTA */}
        <div className="card newsprint-texture" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)', textAlign: 'center', marginTop: '4rem', border: '2px solid var(--border)', background: 'var(--bg)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1 }}>Ready to Start Practicing?</h2>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No account needed. Start practicing immediately for free.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/practice" className="btn-primary" style={{ padding: 'clamp(0.625rem, 1.5vw, 0.875rem) clamp(1rem, 2vw, 1.5rem)', minWidth: 'clamp(140px, 25vw, 200px)' }}>Start Practicing</Link>
            <Link to="/games" className="btn-secondary" style={{ padding: 'clamp(0.625rem, 1.5vw, 0.875rem) clamp(1rem, 2vw, 1.5rem)', minWidth: 'clamp(140px, 25vw, 200px)' }}>Explore All Games</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ width: 'clamp(40px, 7vw, 48px)', height: 'clamp(40px, 7vw, 48px)', border: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-primary)' }}>
          {icon}
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: 'var(--text-primary)', lineHeight: 1 }}>{title}</h2>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(0.9375rem, 1.5vw, 1rem)', color: 'var(--text-primary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: 'clamp(0px, 5vw, 4rem)' }}>
        {children}
      </div>
    </div>
  );
}

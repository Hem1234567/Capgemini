import { AlertTriangle } from 'lucide-react';

interface NoticeBannerProps {
  message?: string;
  compact?: boolean;
}

export default function NoticeBanner({ message, compact }: NoticeBannerProps) {
  return (
    <div className="notice-banner" style={{ 
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      border: '2px solid var(--border)',
      background: 'var(--text-primary)',
      color: 'var(--bg)',
      padding: compact ? '0.75rem' : '1.25rem',
    }}>
      <AlertTriangle size={compact ? 16 : 20} style={{ flexShrink: 0, marginTop: compact ? 0 : 2, color: 'var(--accent)' }} />
      <p style={{ 
        lineHeight: 1.6, 
        fontFamily: 'var(--font-mono)', 
        fontSize: compact ? '0.75rem' : '0.8125rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em' 
      }}>
        {message ?? (
          <>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>NOTICE:</span> <strong>Independent Practice Platform.</strong> This platform contains Capgemini-style cognitive games created for practice purposes only. It is not affiliated with, endorsed by, or officially connected to Capgemini SE.
          </>
        )}
      </p>
    </div>
  );
}

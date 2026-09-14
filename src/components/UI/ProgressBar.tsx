interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({ value, color, height = 6, showLabel }: ProgressBarProps) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="progress-bar-track" style={{ height }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: color ?? 'var(--accent)' }}
        />
      </div>
    </div>
  );
}

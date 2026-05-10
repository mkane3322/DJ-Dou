import React from 'react';
import { FEATURE_META, describeFeatureValue } from '../../utils/dnaHelpers';

/**
 * Renders a single audio feature as a labelled progress bar.
 *
 * Props:
 *   featureKey  {string}  — one of the 13 audio feature keys
 *   value       {number}  — normalized 0–1 value
 *   showLabel   {boolean} — show the text label (default true)
 *   animate     {boolean} — animate the bar fill on mount (default true)
 *   size        {string}  — 'sm' | 'md' (default 'md')
 */
export default function FeatureBar({
  featureKey,
  value = 0,
  showLabel = true,
  animate = true,
  size = 'md',
}) {
  const meta = FEATURE_META.find((f) => f.key === featureKey) || {
    label: featureKey,
    icon: '🎵',
    color: '#a855f7',
    description: '',
  };

  const pct = Math.round(value * 100);
  const barHeight = size === 'sm' ? '4px' : '6px';
  const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';

  return (
    <div style={styles.wrapper} title={meta.description}>
      {showLabel && (
        <div style={{ ...styles.labelRow, fontSize }}>
          <span style={styles.icon}>{meta.icon}</span>
          <span style={styles.label}>{meta.label}</span>
          <span style={{ ...styles.desc, fontSize: size === 'sm' ? '0.7rem' : '0.75rem' }}>
            {describeFeatureValue(featureKey, value)}
          </span>
          <span style={{ ...styles.pct, fontSize, color: meta.color }}>{pct}%</span>
        </div>
      )}

      <div style={{ ...styles.track, height: barHeight }}>
        <div
          style={{
            ...styles.fill,
            width: animate ? `${pct}%` : `${pct}%`,
            background: `linear-gradient(90deg, ${meta.color}aa, ${meta.color})`,
            boxShadow: `0 0 8px ${meta.color}66`,
            height: barHeight,
            transition: animate ? 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  icon: {
    fontSize: '0.9em',
    flexShrink: 0,
  },
  label: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    flexShrink: 0,
  },
  desc: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pct: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    flexShrink: 0,
  },
  track: {
    width: '100%',
    background: 'var(--bg-overlay)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: '999px',
  },
};

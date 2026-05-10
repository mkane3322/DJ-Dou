import React, { useState } from 'react';
import FeatureBar from './FeatureBar';
import { FEATURE_META } from '../../utils/dnaHelpers';

/**
 * Shows all 13 audio features as a scrollable list of FeatureBars.
 * Accepts either a dnaVector array or an audioFeatures object.
 *
 * Props:
 *   dnaVector    {number[]}  — 13-element normalized vector (preferred)
 *   audioFeatures {Object}  — raw Spotify audioFeatures object (fallback)
 *   title        {string}   — optional section heading
 */
export default function DNABreakdown({ dnaVector, audioFeatures, title = 'Audio Breakdown' }) {
  const [expanded, setExpanded] = useState(false);

  // Build value map from whichever source is provided
  const values = buildValueMap(dnaVector, audioFeatures);
  const visibleCount = expanded ? FEATURE_META.length : 6;

  if (!Object.keys(values).length) return null;

  return (
    <div style={styles.wrapper}>
      {title && <h3 style={styles.title}>{title}</h3>}

      <div style={styles.bars}>
        {FEATURE_META.slice(0, visibleCount).map((meta, i) => (
          <FeatureBar
            key={meta.key}
            featureKey={meta.key}
            value={values[meta.key] ?? 0}
            animate
          />
        ))}
      </div>

      {FEATURE_META.length > 6 && (
        <button style={styles.toggle} onClick={() => setExpanded((e) => !e)}>
          {expanded ? '↑ Show less' : `↓ Show all ${FEATURE_META.length} dimensions`}
        </button>
      )}
    </div>
  );
}

/**
 * Build a { featureKey: normalizedValue } map.
 * If dnaVector is provided, use it. Otherwise fall back to audioFeatures object.
 */
function buildValueMap(dnaVector, audioFeatures) {
  if (dnaVector?.length === 13) {
    return Object.fromEntries(FEATURE_META.map((m, i) => [m.key, dnaVector[i]]));
  }
  if (audioFeatures) {
    // Approximate normalization for display purposes
    const norm = {
      danceability:     audioFeatures.danceability ?? 0,
      energy:           audioFeatures.energy ?? 0,
      key:              (audioFeatures.key ?? 0) / 11,
      loudness:         1 - Math.min(1, Math.abs(audioFeatures.loudness ?? 0) / 60),
      mode:             audioFeatures.mode ?? 0,
      speechiness:      audioFeatures.speechiness ?? 0,
      acousticness:     audioFeatures.acousticness ?? 0,
      instrumentalness: audioFeatures.instrumentalness ?? 0,
      liveness:         audioFeatures.liveness ?? 0,
      valence:          audioFeatures.valence ?? 0,
      tempo:            Math.min(1, Math.max(0, ((audioFeatures.tempo ?? 120) - 50) / 170)),
      duration:         Math.min(1, (audioFeatures.duration_ms ?? 180000) / 600000),
      time_signature:   (audioFeatures.time_signature ?? 4) / 7,
    };
    return norm;
  }
  return {};
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: 'var(--space-4)',
    color: 'var(--text-primary)',
  },
  bars: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  toggle: {
    marginTop: 'var(--space-4)',
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: 0,
    alignSelf: 'flex-start',
    letterSpacing: '0.05em',
  },
};

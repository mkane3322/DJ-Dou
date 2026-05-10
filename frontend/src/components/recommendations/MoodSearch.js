import React, { useState } from 'react';

const PRESETS = [
  { label: 'Late night melancholy', query: 'Something slow and melancholic for a late night drive' },
  { label: 'Workout fuel',          query: 'High energy aggressive beats for a gym session' },
  { label: 'Rainy Sunday',          query: 'Soft acoustic music for a rainy Sunday morning' },
  { label: 'Deep focus',            query: 'Instrumental minimal music for focused work' },
  { label: 'Summer happiness',      query: 'Happy danceable summer vibes' },
  { label: 'Cinematic feels',       query: 'Cinematic orchestral emotional music' },
  { label: 'Nostalgic 90s energy',  query: 'Nostalgic upbeat 90s feel with bright energy' },
  { label: 'Midnight jazz',         query: 'Late night jazz instrumental smooth and mellow' },
];

/**
 * Mood search input + preset chips.
 *
 * Props:
 *   onSearch  {function(query: string)} — called when user submits a query
 *   loading   {boolean}
 */
export default function MoodSearch({ onSearch, loading }) {
  const [query, setQuery] = useState('');

  const submit = (q) => {
    const final = (q || query).trim();
    if (final) onSearch(final);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.inputRow}>
        <div style={styles.inputInner}>
          <span style={styles.aiDot} />
          <input
            style={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Describe how you want to feel… e.g. melancholic and slow for a rainy day"
          />
        </div>
        <button
          style={{ ...styles.btn, opacity: loading || !query.trim() ? 0.5 : 1 }}
          onClick={() => submit()}
          disabled={loading || !query.trim()}
        >
          {loading ? <Spinner /> : 'Search'}
        </button>
      </div>

      <div style={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            style={styles.chip}
            onClick={() => { setQuery(p.query); submit(p.query); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p style={styles.hint}>
        ✦ Powered by Claude AI — translates your mood into audio feature filters
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  inputRow: { display: 'flex', gap: 'var(--space-3)', alignItems: 'stretch' },
  inputInner: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    background: 'var(--bg-base)', border: '1px solid var(--border-bright)',
    borderRadius: 'var(--radius-md)', padding: '0 var(--space-4)',
    transition: 'border-color var(--transition-fast)',
  },
  aiDot: {
    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
    background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)',
  },
  input: {
    flex: 1, border: 'none', background: 'none', outline: 'none',
    color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
    fontSize: '0.95rem', padding: 'var(--space-3) 0',
  },
  btn: {
    padding: 'var(--space-3) var(--space-6)',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    transition: 'opacity var(--transition-fast)', whiteSpace: 'nowrap',
  },
  presets: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' },
  chip: {
    padding: '0.3rem 0.85rem',
    background: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-display)', fontSize: '0.78rem', cursor: 'pointer',
    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
  },
  hint: {
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
};

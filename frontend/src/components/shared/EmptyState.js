import React from 'react';

/**
 * A centered empty state with icon, title, description and optional CTA.
 *
 * Props:
 *   icon    {string}    — emoji or character
 *   title   {string}
 *   desc    {string}
 *   action  {object}   — { label: string, onClick: fn }
 */
export default function EmptyState({ icon = '🎵', title, desc, action }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.icon}>{icon}</div>
      {title && <h3 style={styles.title}>{title}</h3>}
      {desc  && <p  style={styles.desc}>{desc}</p>}
      {action && (
        <button style={styles.btn} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 'var(--space-16) var(--space-6)', gap: 'var(--space-3)', textAlign: 'center',
  },
  icon:  { fontSize: '3rem', marginBottom: 'var(--space-2)', filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.4))' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' },
  desc:  { color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: 1.6, fontSize: '0.9rem' },
  btn: {
    marginTop: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-6)',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hot))',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer', boxShadow: '0 0 24px rgba(168,85,247,0.3)',
  },
};
